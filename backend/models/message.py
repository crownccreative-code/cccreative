from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SenderRole(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"

class ThreadCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)

class ThreadResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    subject: str
    last_message: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime

class MessageCreate(BaseModel):
    body: str = Field(..., min_length=1)
    attachments: Optional[List[str]] = None

class MessageResponse(BaseModel):
    id: str
    thread_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_role: SenderRole
    body: str
    attachments: List[str] = []
    created_at: datetime
