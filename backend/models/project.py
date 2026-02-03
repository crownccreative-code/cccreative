from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ProjectStatus(str, Enum):
    NOT_STARTED = "not_started"
    ACTIVE = "active"
    PAUSED = "paused"
    DELIVERED = "delivered"

class TimelineItem(BaseModel):
    milestone: str
    status: str = "pending"
    due_date: Optional[str] = None
    completed_date: Optional[str] = None

class ProjectUpdate(BaseModel):
    status: Optional[ProjectStatus] = None
    title: Optional[str] = None

class TimelineUpdate(BaseModel):
    timeline: List[TimelineItem]

class ProjectResponse(BaseModel):
    id: str
    order_id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    title: str
    status: ProjectStatus
    timeline: List[TimelineItem] = []
    created_at: datetime
