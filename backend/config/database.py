from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "ccc_db")

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.services.create_index("name")
    await db.orders.create_index("user_id")
    await db.projects.create_index("user_id")
    await db.threads.create_index("user_id")
    await db.payment_transactions.create_index("session_id", unique=True)
    print("Connected to MongoDB")
    return db

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
