from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"
    REFUNDED = "refunded"

class OrderItemCreate(BaseModel):
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1)

class OrderItemResponse(BaseModel):
    id: str
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    service_name: Optional[str] = None
    package_name: Optional[str] = None
    quantity: int
    unit_price: float
    line_total: float

class OrderCreate(BaseModel):
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[OrderStatus] = None

class OrderResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status: OrderStatus
    items: List[OrderItemResponse] = []
    subtotal: float
    tax: float = 0.0
    total: float
    currency: str = "usd"
    notes: Optional[str] = None
    created_at: datetime

class ApplyCouponRequest(BaseModel):
    code: str
