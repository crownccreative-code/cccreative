from fastapi import APIRouter, HTTPException, Depends, Request
from bson import ObjectId
from datetime import datetime
import os
from config.database import get_db
from config.settings import settings
from middleware.auth import get_current_user, require_admin
from models.payment import (
    CreateCheckoutRequest, CheckoutResponse, PaymentStatus,
    PaymentTransactionResponse
)
from models.order import OrderStatus
from services.email_service import email_service
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crowncollective.com")

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(request: CreateCheckoutRequest, http_request: Request, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Get order
    order = await db.orders.find_one({"_id": ObjectId(request.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if str(order["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if order["status"] not in [OrderStatus.DRAFT, OrderStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Order cannot be paid")
    
    if order["total"] <= 0:
        raise HTTPException(status_code=400, detail="Order total must be greater than 0")
    
    # Initialize Stripe
    host_url = request.origin_url.rstrip('/')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=settings.STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Build URLs
    success_url = f"{host_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/payment/cancel"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency=order.get("currency", "usd"),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": request.order_id,
            "user_id": current_user["id"],
            "user_email": current_user["email"]
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "order_id": request.order_id,
        "user_id": current_user["id"],
        "amount": float(order["total"]),
        "currency": order.get("currency", "usd"),
        "session_id": session.session_id,
        "provider": "stripe",
        "status": PaymentStatus.INITIATED,
        "payment_status": "initiated",
        "metadata": checkout_request.metadata,
        "created_at": datetime.utcnow()
    })
    
    # Update order status to pending
    await db.orders.update_one(
        {"_id": ObjectId(request.order_id)},
        {"$set": {"status": OrderStatus.PENDING}}
    )
    
    return CheckoutResponse(url=session.url, session_id=session.session_id)

@router.get("/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Get transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if already processed
    if transaction["status"] == PaymentStatus.PAID:
        return {
            "status": "complete",
            "payment_status": "paid",
            "amount_total": transaction["amount"],
            "currency": transaction["currency"]
        }
    
    # Check with Stripe
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=settings.STRIPE_API_KEY, webhook_url=webhook_url)
    
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction based on status
    new_status = PaymentStatus.PENDING
    if status.payment_status == "paid":
        new_status = PaymentStatus.PAID
    elif status.status == "expired":
        new_status = PaymentStatus.EXPIRED
    
    # Only process paid status once
    if new_status == PaymentStatus.PAID and transaction["status"] != PaymentStatus.PAID:
        await process_successful_payment(db, transaction["order_id"], session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": new_status,
            "payment_status": status.payment_status
        }}
    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total / 100,  # Convert from cents
        "currency": status.currency
    }

async def process_successful_payment(db, order_id: str, session_id: str):
    """Process a successful payment - update order and create project"""
    # Get order
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        return
    
    # Update order status
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": OrderStatus.PAID}}
    )
    
    # Create project
    await db.projects.insert_one({
        "order_id": order_id,
        "user_id": order["user_id"],
        "title": f"Project for Order #{order_id[-6:]}",
        "status": "not_started",
        "timeline": [],
        "created_at": datetime.utcnow()
    })
    
    # Get user for email
    user = await db.users.find_one({"_id": order["user_id"]})
    if user:
        await email_service.send_payment_confirmation(
            user["email"],
            order_id,
            order["total"]
        )
        # Notify admin
        await email_service.send_new_order_notification(
            ADMIN_EMAIL,
            order_id,
            user["name"]
        )

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    db = get_db()
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    
    try:
        webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=settings.STRIPE_API_KEY, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        
        if webhook_response.payment_status == "paid":
            # Get order_id from metadata
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                # Check if already processed
                transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                if transaction and transaction["status"] != PaymentStatus.PAID:
                    await process_successful_payment(db, order_id, webhook_response.session_id)
                    await db.payment_transactions.update_one(
                        {"session_id": webhook_response.session_id},
                        {"$set": {
                            "status": PaymentStatus.PAID,
                            "payment_status": "paid"
                        }}
                    )
        
        return {"status": "success"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, admin: dict = Depends(require_admin)):
    """Admin endpoint to refund a payment"""
    db = get_db()
    
    transaction = await db.payment_transactions.find_one({"_id": ObjectId(payment_id)})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if transaction["status"] != PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Only paid transactions can be refunded")
    
    # Note: In production, implement actual Stripe refund API call
    # For now, mark as refunded in DB
    await db.payment_transactions.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {
            "status": PaymentStatus.REFUNDED,
            "payment_status": "refunded",
            "refunded_at": datetime.utcnow()
        }}
    )
    
    # Update order status
    await db.orders.update_one(
        {"_id": ObjectId(transaction["order_id"])},
        {"$set": {"status": OrderStatus.REFUNDED}}
    )
    
    return {"message": "Payment refunded successfully"}

@router.get("", response_model=list)
async def get_payments(current_user: dict = Depends(get_current_user)):
    """Get payments - admin gets all, client gets own"""
    db = get_db()
    
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["id"]
    
    transactions = await db.payment_transactions.find(query).sort("created_at", -1).to_list(100)
    
    return [
        PaymentTransactionResponse(
            id=str(t["_id"]),
            order_id=t["order_id"],
            user_id=t["user_id"],
            amount=t["amount"],
            currency=t["currency"],
            session_id=t["session_id"],
            provider=t.get("provider", "stripe"),
            status=t["status"],
            payment_status=t.get("payment_status"),
            receipt_url=t.get("receipt_url"),
            created_at=t["created_at"]
        ) for t in transactions
    ]
