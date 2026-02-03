from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.message import (
    ThreadCreate, ThreadResponse,
    MessageCreate, MessageResponse, SenderRole
)

router = APIRouter(prefix="/api/threads", tags=["Messaging"])

@router.post("", response_model=ThreadResponse)
async def create_thread(thread: ThreadCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    thread_doc = {
        "user_id": current_user["id"],
        "subject": thread.subject,
        "last_message": None,
        "message_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.threads.insert_one(thread_doc)
    
    return ThreadResponse(
        id=str(result.inserted_id),
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_email=current_user["email"],
        subject=thread.subject,
        last_message=None,
        message_count=0,
        created_at=thread_doc["created_at"],
        updated_at=thread_doc["updated_at"]
    )

@router.get("", response_model=List[ThreadResponse])
async def get_threads(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["id"]
    
    threads = await db.threads.find(query).sort("updated_at", -1).to_list(100)
    
    result = []
    for thread in threads:
        user = await db.users.find_one({"_id": ObjectId(thread["user_id"])})
        result.append(ThreadResponse(
            id=str(thread["_id"]),
            user_id=thread["user_id"],
            user_name=user["name"] if user else None,
            user_email=user["email"] if user else None,
            subject=thread["subject"],
            last_message=thread.get("last_message"),
            message_count=thread.get("message_count", 0),
            created_at=thread["created_at"],
            updated_at=thread["updated_at"]
        ))
    
    return result

@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    thread = await db.threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"_id": ObjectId(thread["user_id"])})
    
    return ThreadResponse(
        id=str(thread["_id"]),
        user_id=thread["user_id"],
        user_name=user["name"] if user else None,
        user_email=user["email"] if user else None,
        subject=thread["subject"],
        last_message=thread.get("last_message"),
        message_count=thread.get("message_count", 0),
        created_at=thread["created_at"],
        updated_at=thread["updated_at"]
    )

@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def get_messages(thread_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    thread = await db.threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.messages.find({"thread_id": thread_id}).sort("created_at", 1).to_list(500)
    
    result = []
    for msg in messages:
        sender = await db.users.find_one({"_id": ObjectId(msg["sender_id"])})
        result.append(MessageResponse(
            id=str(msg["_id"]),
            thread_id=msg["thread_id"],
            sender_id=msg["sender_id"],
            sender_name=sender["name"] if sender else None,
            sender_role=msg["sender_role"],
            body=msg["body"],
            attachments=msg.get("attachments", []),
            created_at=msg["created_at"]
        ))
    
    return result

@router.post("/{thread_id}/messages", response_model=MessageResponse)
async def create_message(thread_id: str, message: MessageCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    thread = await db.threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    sender_role = SenderRole.ADMIN if current_user["role"] == "admin" else SenderRole.CLIENT
    
    message_doc = {
        "thread_id": thread_id,
        "sender_id": current_user["id"],
        "sender_role": sender_role,
        "body": message.body,
        "attachments": message.attachments or [],
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_doc)
    
    # Update thread
    await db.threads.update_one(
        {"_id": ObjectId(thread_id)},
        {
            "$set": {
                "last_message": message.body[:100],
                "updated_at": datetime.utcnow()
            },
            "$inc": {"message_count": 1}
        }
    )
    
    return MessageResponse(
        id=str(result.inserted_id),
        thread_id=thread_id,
        sender_id=current_user["id"],
        sender_name=current_user["name"],
        sender_role=sender_role,
        body=message.body,
        attachments=message.attachments or [],
        created_at=message_doc["created_at"]
    )
