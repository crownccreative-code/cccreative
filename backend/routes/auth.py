from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
import os
from pydantic import BaseModel
from config.database import get_db
from middleware.auth import (
    hash_password, 
    verify_password, 
    create_access_token,
    get_current_user,
    decode_token
)
from models.user import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    TokenResponse,
    UserRole,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from services.email_service import email_service
import secrets

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    db = get_db()
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": UserRole.CLIENT,
        "phone": user_data.phone,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = create_access_token({"sub": user_id, "role": UserRole.CLIENT})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            role=UserRole.CLIENT,
            phone=user_data.phone,
            created_at=user_doc["created_at"]
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user["role"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=user["role"],
            phone=user.get("phone"),
            created_at=user["created_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": request.email})
    
    # Always return success to prevent email enumeration
    if user:
        reset_token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({
            "user_id": user["_id"],
            "token": reset_token,
            "created_at": datetime.utcnow(),
            "used": False
        })
        # Send reset email (mock mode)
        frontend_url = os.environ.get("FRONTEND_URL", "https://crowncollective.com")
        await email_service.send_password_reset(
            request.email, 
            reset_token, 
            f"{frontend_url}/reset-password"
        )
    
    return {"message": "If your email exists, you will receive a reset link"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    db = get_db()
    
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Update password
    await db.users.update_one(
        {"_id": reset_record["user_id"]},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change password for logged in user"""
    db = get_db()
    
    # Get user from database
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Password changed successfully"}
