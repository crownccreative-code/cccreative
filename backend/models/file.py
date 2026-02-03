from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FileUploadCreate(BaseModel):
    filename: str
    url: str
    public_id: str
    mime_type: str
    size: int
    order_id: Optional[str] = None
    project_id: Optional[str] = None

class FileUploadResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    url: str
    public_id: str
    mime_type: str
    size: int
    order_id: Optional[str] = None
    project_id: Optional[str] = None
    created_at: datetime

class PortfolioItemCreate(BaseModel):
    title: Optional[str] = None
    url: str
    public_id: str
    mime_type: str
    size: int
    order_index: int = 0

class PortfolioItemResponse(BaseModel):
    id: str
    title: Optional[str] = None
    url: str
    public_id: str
    mime_type: str
    size: int
    order_index: int
    created_at: datetime

class CloudinarySignatureResponse(BaseModel):
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str
