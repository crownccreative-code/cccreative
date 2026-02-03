from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from enum import Enum

class PaymentStatus(str, Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"

class PaymentTransactionCreate(BaseModel):
    order_id: str
    user_id: str
    amount: float
    currency: str = "usd"
    session_id: str
    metadata: Optional[Dict] = None
    status: PaymentStatus = PaymentStatus.INITIATED

class PaymentTransactionResponse(BaseModel):
    id: str
    order_id: str
    user_id: str
    amount: float
    currency: str
    session_id: str
    provider: str = "stripe"
    status: PaymentStatus
    payment_status: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime

class CreateCheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str
