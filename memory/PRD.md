# Crown Collective Creative (CCC) - Product Requirements Document

## Project Overview
Full-stack service business platform for Crown Collective Creative offering web design, branding, digital marketing strategy, and AI integration/automation services.

## Architecture
- **Backend**: Python FastAPI on port 8001
- **Frontend**: React with react-router-dom on port 3000
- **Database**: MongoDB (local, no auth)
- **Payments**: Stripe Checkout (test mode)
- **File Storage**: Cloudinary (needs configuration)
- **Email**: Mock mode (console logging)

## User Personas
1. **CCC Admin**: Business owner (crownccreative@gmail.com) - manages client projects, status, action items
2. **Admin**: Regular admin managing services, orders, intakes, portfolio, users
3. **Client**: Customer who views their project status, action items, uploads files, messages team

## Core Requirements (Static)
- [x] JWT authentication with bcrypt password hashing
- [x] Role-based access control (admin/client)
- [x] Services and Packages CRUD
- [x] Order management with line items
- [x] Stripe Checkout integration
- [x] Intake form system (branding/website/marketing/ai)
- [x] Project tracking with timeline
- [x] Messaging/threads system
- [x] File upload with Cloudinary
- [x] Admin dashboard with analytics
- [x] Client portal
- [x] **Role-Based Project Management System (NEW)**

## What's Been Implemented (Feb 7, 2026)

### Role-Based Project Management System (P0 - COMPLETE)
- **Hidden Admin Route `/ccc-admin`**: Only accessible by crownccreative@gmail.com
- **Admin Dashboard Features**:
  - View all clients with search functionality
  - Select client to manage their project
  - Update Project Status (text field)
  - Update Progress (0-100% slider with visual bar)
  - Manage Next Steps/Action Items (add, remove, toggle completion)
  - Internal notes field
  - File upload for clients (via Cloudinary)
- **Client Portal Features**:
  - Dynamic project status display
  - Progress bar visualization
  - Action items checklist (clients can toggle completion)
  - Two-way file sharing
  - Messages section with threads

### Backend API Endpoints
- Auth: /api/auth/register, /login, /me, /forgot-password, /reset-password
- Services: GET/POST/PUT/DELETE /api/services
- Packages: GET/POST/PUT/DELETE /api/packages
- Orders: POST /api/orders, POST /api/orders/{id}/items, GET/PATCH /api/orders/{id}
- Payments: POST /api/payments/create-checkout-session, /webhook/stripe, /refund
- Intake: POST/GET /api/intake
- Projects: GET/PATCH /api/projects, POST /api/projects/{id}/timeline
- Threads: POST/GET /api/threads, GET/POST /api/threads/{id}/messages
- Files: GET /api/files/signature, POST/GET/DELETE /api/files
- Portfolio: GET/POST/DELETE /api/files/portfolio
- Admin: GET /api/admin/users, /stats, PATCH /api/admin/users/{id}/role
- **Client Projects (NEW)**:
  - GET /api/client-projects/check-admin
  - GET /api/client-projects/admin/clients (CCC Admin only)
  - GET /api/client-projects/admin/client/{user_id}
  - PUT /api/client-projects/admin/client/{user_id}
  - POST /api/client-projects/admin/client/{user_id}/next-step
  - DELETE /api/client-projects/admin/client/{user_id}/next-step/{step_id}
  - GET /api/client-projects/my-project
  - PATCH /api/client-projects/my-project/next-step/{step_id}
  - POST /api/client-projects/files/{user_id}
  - GET /api/client-projects/files/{user_id}
  - DELETE /api/client-projects/files/{file_id}

### Frontend Pages
- Landing page with bilingual support (EN/ES)
- Login/Register with JWT auth
- Payment Success/Cancel pages
- Client Portal: Dashboard, Orders, OrderDetail, Projects, Intake, Messages, ThreadDetail, Files
- Admin Panel: Dashboard, Services, Orders, Intakes, Portfolio, Users
- **CCC Admin Dashboard (/ccc-admin)** - NEW

### Database Collections
- users, services, packages, orders, order_items
- payment_transactions, intakes, projects
- threads, messages, files, portfolio, coupons, password_resets
- **client_projects (NEW)**
- **project_files (NEW)**

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Core auth flow
- [x] Order + payment flow
- [x] Admin CRUD
- [x] **Role-Based Project Management System**

### P1 (High)
- [ ] Cloudinary configuration for file uploads
- [ ] Stripe webhook verification in production
- [ ] Email provider integration (SendGrid/Resend)

### P2 (Medium)
- [ ] Coupon/discount system
- [ ] Deposits + pay-in-full options
- [ ] Contract e-sign integration
- [ ] Scheduling/booking system

### P3 (Future)
- [ ] Real-time notifications
- [ ] Project milestones with deliverable uploads
- [ ] Client-side analytics
- [ ] Refactor Landing.js into smaller components

## Test Credentials
- **CCC Admin**: crownccreative@gmail.com / admin1234
- **Test Client**: testclient@example.com / test1234
- **Demo Admin**: admin@crowncollective.com / admin123

## Test Reports
- /app/test_reports/iteration_1.json - Initial build testing
- /app/test_reports/iteration_2.json - Role-based system testing (100% pass rate)
