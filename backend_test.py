import requests
import sys
import json
from datetime import datetime

class CCCAPITester:
    def __init__(self, base_url="https://crown-services.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use admin token if specified
        token = self.admin_token if use_admin else self.token
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "admin@crowncollective.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data={
                "name": f"Test User {timestamp}",
                "email": test_email,
                "password": "TestPass123!",
                "phone": "+1234567890"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.test_user_id = response['user']['id']
            print(f"   User token obtained, ID: {self.test_user_id}")
            return True
        return False

    def test_get_services(self):
        """Test get services (public endpoint)"""
        success, response = self.run_test(
            "Get Services List",
            "GET",
            "/api/services",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} services")
            return True
        return False

    def test_get_packages(self):
        """Test get packages (public endpoint)"""
        success, response = self.run_test(
            "Get Packages List",
            "GET",
            "/api/packages",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} packages")
            return True
        return False

    def test_create_order(self):
        """Test create order (requires auth)"""
        success, response = self.run_test(
            "Create Order",
            "POST",
            "/api/orders",
            200,
            data={"notes": "Test order from API test"}
        )
        if success and 'id' in response:
            self.test_order_id = response['id']
            print(f"   Order created with ID: {self.test_order_id}")
            return True
        return False

    def test_add_order_item(self):
        """Test add order item"""
        if not self.test_order_id:
            print("❌ No order ID available for adding items")
            return False
            
        # First get services to get a service ID
        success, services = self.run_test(
            "Get Services for Order Item",
            "GET",
            "/api/services",
            200
        )
        
        if not success or not services:
            print("❌ Could not get services for order item")
            return False
            
        service_id = services[0]['id']
        
        success, response = self.run_test(
            "Add Order Item",
            "POST",
            f"/api/orders/{self.test_order_id}/items",
            200,
            data={
                "service_id": service_id,
                "quantity": 1
            }
        )
        return success

    def test_get_order(self):
        """Test get specific order"""
        if not self.test_order_id:
            print("❌ No order ID available for retrieval")
            return False
            
        success, response = self.run_test(
            "Get Order Details",
            "GET",
            f"/api/orders/{self.test_order_id}",
            200
        )
        return success

    def test_get_orders(self):
        """Test get orders list"""
        success, response = self.run_test(
            "Get Orders List",
            "GET",
            "/api/orders",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} orders")
            return True
        return False

    def test_admin_services_crud(self):
        """Test admin services CRUD operations"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False

        # Create service
        service_data = {
            "name": "Test Service API",
            "description": "Test service created via API",
            "base_price": 999.99,
            "category": "testing",
            "deliverables_text": "API test deliverables",
            "active": True
        }
        
        success, response = self.run_test(
            "Admin Create Service",
            "POST",
            "/api/services",
            200,
            data=service_data,
            use_admin=True
        )
        
        if success and 'id' in response:
            service_id = response['id']
            print(f"   Service created with ID: {service_id}")
            
            # Update service
            update_success, _ = self.run_test(
                "Admin Update Service",
                "PUT",
                f"/api/services/{service_id}",
                200,
                data={"name": "Updated Test Service API"},
                use_admin=True
            )
            
            # Delete service
            delete_success, _ = self.run_test(
                "Admin Delete Service",
                "DELETE",
                f"/api/services/{service_id}",
                200,
                use_admin=True
            )
            
            return success and update_success and delete_success
        
        return False

    def test_intake_form(self):
        """Test intake form submission"""
        intake_data = {
            "type": "web_design",
            "business_name": "Test Business API",
            "contact_name": "Test Contact",
            "contact_email": "test@example.com",
            "contact_phone": "+1234567890",
            "project_description": "Test project description from API",
            "budget_range": "5000-10000",
            "timeline": "1-3 months",
            "additional_info": "Additional test info"
        }
        
        success, response = self.run_test(
            "Submit Intake Form",
            "POST",
            "/api/intake",
            200,
            data=intake_data
        )
        return success

    def test_messages_thread(self):
        """Test messages/threads functionality"""
        # Create thread
        success, response = self.run_test(
            "Create Message Thread",
            "POST",
            "/api/threads",
            200,
            data={"subject": "Test Thread from API"}
        )
        
        if success and 'id' in response:
            thread_id = response['id']
            print(f"   Thread created with ID: {thread_id}")
            
            # Send message
            message_success, _ = self.run_test(
                "Send Message",
                "POST",
                f"/api/threads/{thread_id}/messages",
                200,
                data={"body": "Test message from API", "attachments": []}
            )
            
            # Get messages
            get_success, _ = self.run_test(
                "Get Messages",
                "GET",
                f"/api/threads/{thread_id}/messages",
                200
            )
            
            return success and message_success and get_success
        
        return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "/api/admin/stats",
            200,
            use_admin=True
        )
        return success

def main():
    print("🚀 Starting Crown Collective Creative API Tests")
    print("=" * 60)
    
    tester = CCCAPITester()
    
    # Core functionality tests
    tests = [
        ("Health Endpoint", tester.test_health_endpoint),
        ("Admin Login", tester.test_admin_login),
        ("User Registration", tester.test_user_registration),
        ("Get Services (Public)", tester.test_get_services),
        ("Get Packages (Public)", tester.test_get_packages),
        ("Create Order (Auth Required)", tester.test_create_order),
        ("Add Order Item", tester.test_add_order_item),
        ("Get Order Details", tester.test_get_order),
        ("Get Orders List", tester.test_get_orders),
        ("Admin Services CRUD", tester.test_admin_services_crud),
        ("Intake Form Submission", tester.test_intake_form),
        ("Messages/Threads", tester.test_messages_thread),
        ("Admin Stats", tester.test_admin_stats),
    ]
    
    print(f"\n📋 Running {len(tests)} test categories...")
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test category failed with exception: {str(e)}")
    
    # Print results
    print(f"\n{'='*60}")
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API tests mostly successful!")
        return 0
    elif success_rate >= 50:
        print("⚠️  Backend API has some issues but core functionality works")
        return 1
    else:
        print("❌ Backend API has significant issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())