from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from dotenv import load_dotenv

load_dotenv()

from config.database import connect_db, close_db
from routes import auth, services, orders, payments, intake, projects, messages, files, admin, client_projects

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await seed_data()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="Crown Collective Creative API",
    description="Backend API for CCC - Web Design, Branding, Digital Marketing & AI Integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(services.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(intake.router)
app.include_router(projects.router)
app.include_router(messages.router)
app.include_router(files.router)
app.include_router(admin.router)
app.include_router(client_projects.router)

# Stripe webhook needs to be at root level
from routes.payments import stripe_webhook
app.post("/api/webhook/stripe")(stripe_webhook)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Crown Collective Creative API"}

async def seed_data():
    """Seed initial data"""
    from config.database import get_db
    from middleware.auth import hash_password
    from datetime import datetime
    
    db = get_db()
    
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@crowncollective.com"})
    if not admin_exists:
        await db.users.insert_one({
            "name": "Admin",
            "email": "admin@crowncollective.com",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        logger.info("Admin user created")
    
    # Seed services if empty
    services_count = await db.services.count_documents({})
    if services_count == 0:
        services = [
            {
                "name": "Auto-Pilot Automation",
                "description": "Connect your favorite apps so they talk to each other automatically. Your business runs itself so you can focus on the big picture.",
                "base_price": 1500.00,
                "category": "automation",
                "deliverables_text": "Custom automation workflows, app integrations, documentation",
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Pro Landing Page",
                "description": "Clean, fast websites that make people trust you. We build pages that turn visitors into fans.",
                "base_price": 2500.00,
                "category": "web_design",
                "deliverables_text": "Custom landing page, mobile responsive, SEO optimized",
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "SEO & Visibility Boost",
                "description": "We put you at the top of Google and Yelp. When people search for help, they find you before anyone else.",
                "base_price": 1000.00,
                "category": "marketing",
                "deliverables_text": "SEO audit, keyword optimization, local listings setup",
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "AI Integration Suite",
                "description": "Get your own AI-powered team that works for you every hour of every day.",
                "base_price": 3500.00,
                "category": "ai",
                "deliverables_text": "Custom AI chatbot, automation setup, training & support",
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Brand Identity Package",
                "description": "Complete brand identity including logo, color palette, typography, and brand guidelines.",
                "base_price": 2000.00,
                "category": "branding",
                "deliverables_text": "Logo design, brand guidelines, social media kit",
                "active": True,
                "created_at": datetime.utcnow()
            }
        ]
        await db.services.insert_many(services)
        logger.info("Services seeded")
    
    # Seed packages if empty
    packages_count = await db.packages.count_documents({})
    if packages_count == 0:
        packages = [
            {
                "name": "The Opening",
                "tier": "foundation",
                "price": 1500.00,
                "included_services": ["Web Audit", "Social Setup", "Simple Tracking"],
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "The Mid-Game",
                "tier": "solution",
                "price": 4500.00,
                "included_services": ["Smart Landing Page", "Google & Yelp Boost", "24/7 Support Staff"],
                "active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "The End-Game",
                "tier": "digit-all",
                "price": 9500.00,
                "included_services": ["Full AI Systems", "Private 24/7 Team", "Infinite Support"],
                "active": True,
                "created_at": datetime.utcnow()
            }
        ]
        await db.packages.insert_many(packages)
        logger.info("Packages seeded")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
