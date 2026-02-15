from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
import os
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.intake import IntakeCreate, IntakeResponse, IntakeType
from services.email_service import email_service

router = APIRouter(prefix="/api/intake", tags=["Intake Forms"])

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crowncollective.com")

@router.post("", response_model=IntakeResponse)
async def create_intake(intake: IntakeCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Verify order if provided
    if intake.order_id:
        order = await db.orders.find_one({"_id": ObjectId(intake.order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if str(order["user_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    intake_doc = {
        "user_id": current_user["id"],
        "order_id": intake.order_id,
        "type": intake.type,
        "answers": intake.answers,
        "created_at": datetime.utcnow()
    }
    
    result = await db.intakes.insert_one(intake_doc)
    
    # Send notification to admin
    await email_service.send_intake_notification(
        ADMIN_EMAIL,
        intake.type,
        current_user["name"]
    )
    
    return IntakeResponse(
        id=str(result.inserted_id),
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_email=current_user["email"],
        order_id=intake.order_id,
        type=intake.type,
        answers=intake.answers,
        created_at=intake_doc["created_at"]
    )

@router.get("/{intake_id}", response_model=IntakeResponse)
async def get_intake(intake_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    intake = await db.intakes.find_one({"_id": ObjectId(intake_id)})
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    
    # Check access
    if intake["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"_id": ObjectId(intake["user_id"])})
    
    return IntakeResponse(
        id=str(intake["_id"]),
        user_id=intake["user_id"],
        user_name=user["name"] if user else None,
        user_email=user["email"] if user else None,
        order_id=intake.get("order_id"),
        type=intake["type"],
        answers=intake["answers"],
        created_at=intake["created_at"]
    )

@router.get("", response_model=List[IntakeResponse])
async def get_intakes(
    type: Optional[IntakeType] = None,
    order_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["id"]
    if type:
        query["type"] = type
    if order_id:
        query["order_id"] = order_id
    
    intakes = await db.intakes.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for intake in intakes:
        user = await db.users.find_one({"_id": ObjectId(intake["user_id"])})
        result.append(IntakeResponse(
            id=str(intake["_id"]),
            user_id=intake["user_id"],
            user_name=user["name"] if user else None,
            user_email=user["email"] if user else None,
            order_id=intake.get("order_id"),
            type=intake["type"],
            answers=intake["answers"],
            created_at=intake["created_at"]
        ))
    
    return result
