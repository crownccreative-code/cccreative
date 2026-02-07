"""
Test suite for Client Projects API - Role-Based Access Control
Tests admin-only endpoints and client endpoints for CCC project management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cccapi.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "crownccreative@gmail.com"
ADMIN_PASSWORD = "admin1234"
CLIENT_EMAIL = "testclient@example.com"
CLIENT_PASSWORD = "test1234"


class TestSetup:
    """Setup and helper methods"""
    
    @staticmethod
    def login(email, password):
        """Login and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            # API returns access_token, not token
            return data.get("access_token") or data.get("token")
        return None
    
    @staticmethod
    def get_auth_headers(token):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")


class TestAdminAuthentication:
    """Test admin login and access"""
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data or "token" in data
        assert "user" in data
        assert data["user"]["email"].lower() == ADMIN_EMAIL.lower()
        print(f"✓ Admin login successful for {ADMIN_EMAIL}")
    
    def test_check_admin_endpoint_for_admin(self):
        """Test /check-admin returns is_ccc_admin: true for admin"""
        token = TestSetup.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token is not None, "Admin login failed"
        
        headers = TestSetup.get_auth_headers(token)
        response = requests.get(f"{BASE_URL}/api/client-projects/check-admin", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_ccc_admin"] == True
        assert data["email"].lower() == ADMIN_EMAIL.lower()
        print("✓ Admin check endpoint returns is_ccc_admin: true for admin")


class TestClientAuthentication:
    """Test client login and access restrictions"""
    
    def test_client_login_success(self):
        """Test client can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Client login failed: {response.text}"
        data = response.json()
        assert "access_token" in data or "token" in data
        assert "user" in data
        print(f"✓ Client login successful for {CLIENT_EMAIL}")
    
    def test_check_admin_endpoint_for_client(self):
        """Test /check-admin returns is_ccc_admin: false for non-admin"""
        token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        assert token is not None, "Client login failed"
        
        headers = TestSetup.get_auth_headers(token)
        response = requests.get(f"{BASE_URL}/api/client-projects/check-admin", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_ccc_admin"] == False
        print("✓ Admin check endpoint returns is_ccc_admin: false for client")


class TestAdminOnlyEndpoints:
    """Test admin-only endpoints access control"""
    
    def test_get_all_clients_as_admin(self):
        """Test admin can get all clients"""
        token = TestSetup.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token is not None, "Admin login failed"
        
        headers = TestSetup.get_auth_headers(token)
        response = requests.get(f"{BASE_URL}/api/client-projects/admin/clients", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can get all clients - found {len(data)} clients")
        return data
    
    def test_get_all_clients_as_client_denied(self):
        """Test non-admin cannot access admin/clients endpoint"""
        token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        assert token is not None, "Client login failed"
        
        headers = TestSetup.get_auth_headers(token)
        response = requests.get(f"{BASE_URL}/api/client-projects/admin/clients", headers=headers)
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin correctly denied access to admin/clients endpoint")
    
    def test_get_all_clients_unauthenticated_denied(self):
        """Test unauthenticated request is denied"""
        response = requests.get(f"{BASE_URL}/api/client-projects/admin/clients")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthenticated request correctly denied")


class TestClientProjectCRUD:
    """Test client project CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and get a client user ID"""
        self.admin_token = TestSetup.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert self.admin_token is not None, "Admin login failed"
        self.admin_headers = TestSetup.get_auth_headers(self.admin_token)
        
        # Get client user ID
        self.client_token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        if self.client_token:
            me_response = requests.get(f"{BASE_URL}/api/auth/me", 
                                       headers=TestSetup.get_auth_headers(self.client_token))
            if me_response.status_code == 200:
                self.client_user_id = me_response.json().get("id")
            else:
                self.client_user_id = None
        else:
            self.client_user_id = None
    
    def test_get_client_project_as_admin(self):
        """Test admin can get/create a client's project"""
        if not self.client_user_id:
            pytest.skip("Client user ID not available")
        
        response = requests.get(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=self.admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or data.get("id") == ""  # May be empty string for new project
        assert "status_text" in data
        assert "progress_percentage" in data
        assert "next_steps" in data
        print(f"✓ Admin can get client project - status: {data['status_text']}, progress: {data['progress_percentage']}%")
    
    def test_update_client_project_status(self):
        """Test admin can update client project status"""
        if not self.client_user_id:
            pytest.skip("Client user ID not available")
        
        # First get the project to ensure it exists
        requests.get(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=self.admin_headers
        )
        
        # Update the project
        update_data = {
            "status_text": "In Progress - Testing",
            "progress_percentage": 50,
            "notes": "Test notes from pytest"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=self.admin_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status_text"] == "In Progress - Testing"
        assert data["progress_percentage"] == 50
        print("✓ Admin can update client project status and progress")
        
        # Verify persistence with GET
        verify_response = requests.get(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=self.admin_headers
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["status_text"] == "In Progress - Testing"
        assert verify_data["progress_percentage"] == 50
        print("✓ Project update persisted correctly")


class TestNextStepsManagement:
    """Test next steps (action items) management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tokens and user IDs"""
        self.admin_token = TestSetup.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        self.admin_headers = TestSetup.get_auth_headers(self.admin_token)
        
        self.client_token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        if self.client_token:
            me_response = requests.get(f"{BASE_URL}/api/auth/me", 
                                       headers=TestSetup.get_auth_headers(self.client_token))
            if me_response.status_code == 200:
                self.client_user_id = me_response.json().get("id")
                self.client_headers = TestSetup.get_auth_headers(self.client_token)
            else:
                self.client_user_id = None
        else:
            self.client_user_id = None
    
    def test_add_next_step_as_admin(self):
        """Test admin can add a next step"""
        if not self.client_user_id:
            pytest.skip("Client user ID not available")
        
        # Ensure project exists
        requests.get(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=self.admin_headers
        )
        
        step_text = f"Test step {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}/next-step?text={step_text}",
            headers=self.admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "step" in data
        assert data["step"]["text"] == step_text
        assert data["step"]["completed"] == False
        print(f"✓ Admin can add next step: {step_text}")
        return data["step"]["id"]
    
    def test_remove_next_step_as_admin(self):
        """Test admin can remove a next step"""
        if not self.client_user_id:
            pytest.skip("Client user ID not available")
        
        # First add a step
        step_text = f"Step to delete {uuid.uuid4().hex[:8]}"
        add_response = requests.post(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}/next-step?text={step_text}",
            headers=self.admin_headers
        )
        
        if add_response.status_code != 200:
            pytest.skip("Could not add step to delete")
        
        step_id = add_response.json()["step"]["id"]
        
        # Delete the step
        delete_response = requests.delete(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}/next-step/{step_id}",
            headers=self.admin_headers
        )
        
        assert delete_response.status_code == 200
        print(f"✓ Admin can remove next step: {step_id}")


class TestClientEndpoints:
    """Test client-facing endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup client token"""
        self.client_token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        if self.client_token:
            self.client_headers = TestSetup.get_auth_headers(self.client_token)
            me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.client_headers)
            if me_response.status_code == 200:
                self.client_user_id = me_response.json().get("id")
            else:
                self.client_user_id = None
        else:
            self.client_headers = None
            self.client_user_id = None
    
    def test_get_my_project(self):
        """Test client can get their own project"""
        if not self.client_token:
            pytest.skip("Client login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/client-projects/my-project",
            headers=self.client_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "status_text" in data
        assert "progress_percentage" in data
        assert "next_steps" in data
        print(f"✓ Client can get their project - status: {data['status_text']}, progress: {data['progress_percentage']}%")
    
    def test_toggle_next_step_completion(self):
        """Test client can toggle step completion"""
        if not self.client_token or not self.client_user_id:
            pytest.skip("Client login failed")
        
        # First, admin adds a step
        admin_token = TestSetup.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        admin_headers = TestSetup.get_auth_headers(admin_token)
        
        # Ensure project exists
        requests.get(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}",
            headers=admin_headers
        )
        
        step_text = f"Client toggle test {uuid.uuid4().hex[:8]}"
        add_response = requests.post(
            f"{BASE_URL}/api/client-projects/admin/client/{self.client_user_id}/next-step?text={step_text}",
            headers=admin_headers
        )
        
        if add_response.status_code != 200:
            pytest.skip("Could not add step for toggle test")
        
        step_id = add_response.json()["step"]["id"]
        
        # Client toggles the step
        toggle_response = requests.patch(
            f"{BASE_URL}/api/client-projects/my-project/next-step/{step_id}?completed=true",
            headers=self.client_headers
        )
        
        assert toggle_response.status_code == 200
        print(f"✓ Client can toggle step completion")
        
        # Verify the change
        project_response = requests.get(
            f"{BASE_URL}/api/client-projects/my-project",
            headers=self.client_headers
        )
        
        if project_response.status_code == 200:
            project_data = project_response.json()
            step = next((s for s in project_data["next_steps"] if s["id"] == step_id), None)
            if step:
                assert step["completed"] == True
                print("✓ Step completion status persisted correctly")


class TestAccessControlDenials:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup client token"""
        self.client_token = TestSetup.login(CLIENT_EMAIL, CLIENT_PASSWORD)
        if self.client_token:
            self.client_headers = TestSetup.get_auth_headers(self.client_token)
        else:
            self.client_headers = None
    
    def test_client_cannot_access_admin_clients(self):
        """Test client cannot access /admin/clients"""
        if not self.client_token:
            pytest.skip("Client login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/client-projects/admin/clients",
            headers=self.client_headers
        )
        
        assert response.status_code == 403
        print("✓ Client correctly denied access to /admin/clients")
    
    def test_client_cannot_update_other_project(self):
        """Test client cannot update another user's project via admin endpoint"""
        if not self.client_token:
            pytest.skip("Client login failed")
        
        # Try to access admin endpoint with a random user ID
        fake_user_id = "507f1f77bcf86cd799439011"  # Random ObjectId
        
        response = requests.put(
            f"{BASE_URL}/api/client-projects/admin/client/{fake_user_id}",
            headers=self.client_headers,
            json={"status_text": "Hacked!"}
        )
        
        assert response.status_code == 403
        print("✓ Client correctly denied access to update other projects")
    
    def test_client_cannot_add_step_via_admin_endpoint(self):
        """Test client cannot add steps via admin endpoint"""
        if not self.client_token:
            pytest.skip("Client login failed")
        
        fake_user_id = "507f1f77bcf86cd799439011"
        
        response = requests.post(
            f"{BASE_URL}/api/client-projects/admin/client/{fake_user_id}/next-step?text=Hacked",
            headers=self.client_headers
        )
        
        assert response.status_code == 403
        print("✓ Client correctly denied access to add steps via admin endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
