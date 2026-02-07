from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class NextStepItem(BaseModel):
    id: str
    text: str
    completed: bool = False

class ClientProjectCreate(BaseModel):
    user_id: str
    status_text: str = "Not Started"
    progress_percentage: int = Field(default=0, ge=0, le=100)
    next_steps: List[NextStepItem] = []
    notes: Optional[str] = None

class ClientProjectUpdate(BaseModel):
    status_text: Optional[str] = None
    progress_percentage: Optional[int] = Field(default=None, ge=0, le=100)
    next_steps: Optional[List[NextStepItem]] = None
    notes: Optional[str] = None

class ClientProjectResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status_text: str
    progress_percentage: int
    next_steps: List[NextStepItem]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ProjectFileCreate(BaseModel):
    filename: str
    url: str
    public_id: str
    mime_type: str
    size: int
    uploaded_by: str  # 'admin' or 'client'
    description: Optional[str] = None

class ProjectFileResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    filename: str
    url: str
    public_id: str
    mime_type: str
    size: int
    uploaded_by: str
    uploader_name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

class ClientOverview(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    status_text: Optional[str] = None
    progress_percentage: Optional[int] = None
    has_project: bool
    created_at: datetime
