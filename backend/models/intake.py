from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class IntakeType(str, Enum):
    BRANDING = "branding"
    WEBSITE = "website"
    MARKETING = "marketing"
    AI = "ai"

class IntakeCreate(BaseModel):
    type: IntakeType
    order_id: Optional[str] = None
    answers: Dict[str, Any]

class IntakeResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    order_id: Optional[str] = None
    type: IntakeType
    answers: Dict[str, Any]
    created_at: datetime
