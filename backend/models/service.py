from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: str
    base_price: float = Field(..., gt=0)
    category: str
    deliverables_text: Optional[str] = None
    active: bool = True

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    category: Optional[str] = None
    deliverables_text: Optional[str] = None
    active: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: str
    name: str
    description: str
    base_price: float
    category: str
    deliverables_text: Optional[str] = None
    active: bool
    created_at: datetime

class PackageCreate(BaseModel):
    name: str = Field(..., min_length=2)
    tier: str = Field(..., pattern="^(foundation|solution|digit-all)$")
    price: float = Field(..., gt=0)
    included_services: List[str] = []
    active: bool = True

class PackageUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[str] = None
    price: Optional[float] = None
    included_services: Optional[List[str]] = None
    active: Optional[bool] = None

class PackageResponse(BaseModel):
    id: str
    name: str
    tier: str
    price: float
    included_services: List[str]
    active: bool
    created_at: datetime
