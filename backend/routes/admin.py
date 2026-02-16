from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from config.database import get_db
from middleware.auth import require_admin, hash_password
from models.user import UserResponse, UserRole

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class CreateClientRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/users/create-client", response_model=UserResponse)
async def create_client(request: CreateClientRequest, admin: dict = Depends(require_admin)):
    """Create a new client account (admin only)"""
    db = get_db()
    
    # Check if email already exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "name": request.name,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "role": "client",
        "phone": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=str(result.inserted_id),
        name=request.name,
        email=request.email,
        role="client",
        phone=None,
        created_at=user_doc["created_at"]
    )

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """Delete a user account (admin only)"""
    db = get_db()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if str(user["_id"]) == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete the user
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    # Also delete related data (optional: intakes, orders, etc.)
    await db.intakes.delete_many({"user_id": user_id})
    await db.client_projects.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    admin: dict = Depends(require_admin)
):
    """Get all users (admin only)"""
    db = get_db()
    
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query).sort("created_at", -1).to_list(100)
    
    return [
        UserResponse(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=u["role"],
            phone=u.get("phone"),
            created_at=u["created_at"]
        ) for u in users
    ]

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, admin: dict = Depends(require_admin)):
    """Get user by ID (admin only)"""
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )

@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, admin: dict = Depends(require_admin)):
    """Update user role (admin only)"""
    db = get_db()
    
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {role}"}

@router.get("/stats")
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    """Get dashboard statistics (admin only)"""
    db = get_db()
    
    # Get counts
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_projects = await db.projects.count_documents({})
    
    # Get orders by status
    paid_orders = await db.orders.count_documents({"status": "paid"})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"status": {"$in": ["paid", "in_progress", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Get recent activity
    recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
    recent_intakes = await db.intakes.find().sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "users": total_users,
        "orders": {
            "total": total_orders,
            "paid": paid_orders,
            "pending": pending_orders,
            "completed": completed_orders
        },
        "projects": total_projects,
        "revenue": total_revenue,
        "recent_orders": [
            {"id": str(o["_id"]), "status": o["status"], "total": o["total"], "created_at": o["created_at"].isoformat()}
            for o in recent_orders
        ],
        "recent_intakes": [
            {"id": str(i["_id"]), "type": i["type"], "created_at": i["created_at"].isoformat()}
            for i in recent_intakes
        ]
    }
