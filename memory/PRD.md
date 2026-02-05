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
1. **Admin**: Business owner managing services, orders, intakes, portfolio, users
2. **Client**: Customer who orders services, submits intake forms, messages team, uploads files

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

## What's Been Implemented (Feb 2026)

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

### Frontend Pages
- Landing page with bilingual support (EN/ES)
- Login/Register with JWT auth
- Payment Success/Cancel pages
- Client Portal: Dashboard, Orders, OrderDetail, Projects, Intake, Messages, ThreadDetail, Files
- Admin Panel: Dashboard, Services, Orders, Intakes, Portfolio, Users

### Database Collections
- users, services, packages, orders, order_items
- payment_transactions, intakes, projects
- threads, messages, files, portfolio, coupons, password_resets

## Prioritized Backlog

### P0 (Critical)
- [x] Core auth flow
- [x] Order + payment flow
- [x] Admin CRUD

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

## Next Tasks
1. Configure Cloudinary credentials for file/portfolio uploads
2. Set up production Stripe keys
3. Implement email provider for notifications
4. Add more intake form types
5. Enhance project timeline with deliverables

## Demo Credentials
- Admin: admin@crowncollective.com / admin123
