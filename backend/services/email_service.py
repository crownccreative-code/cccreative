from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Mock email service - abstraction layer for future provider integration"""
    
    def __init__(self, mock_mode: bool = True):
        self.mock_mode = mock_mode
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        if self.mock_mode:
            logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}")
            logger.info(f"[MOCK EMAIL] Body: {body[:100]}...")
            return True
        
        # Future: Implement SendGrid/Resend integration here
        return False
    
    async def send_payment_confirmation(self, to_email: str, order_id: str, amount: float) -> bool:
        subject = "Payment Confirmation - Crown Collective Creative"
        body = f"""Thank you for your payment!

Order ID: {order_id}
Amount: ${amount:.2f}

We'll be in touch shortly to begin your project.

Best regards,
Crown Collective Creative Team"""
        return await self.send_email(to_email, subject, body)
    
    async def send_new_order_notification(self, admin_email: str, order_id: str, client_name: str) -> bool:
        subject = "New Order Received"
        body = f"""A new order has been placed.

Order ID: {order_id}
Client: {client_name}

Please review in the admin dashboard."""
        return await self.send_email(admin_email, subject, body)
    
    async def send_intake_notification(self, admin_email: str, intake_type: str, client_name: str) -> bool:
        subject = f"New Intake Form Submitted - {intake_type.upper()}"
        body = f"""A new intake form has been submitted.

Type: {intake_type}
Client: {client_name}

Please review in the admin dashboard."""
        return await self.send_email(admin_email, subject, body)
    
    async def send_password_reset(self, to_email: str, reset_token: str, reset_url: str) -> bool:
        subject = "Password Reset Request - Crown Collective Creative"
        body = f"""You requested a password reset.

Click the link below to reset your password:
{reset_url}?token={reset_token}

This link expires in 1 hour.

If you didn't request this, please ignore this email."""
        return await self.send_email(to_email, subject, body)

email_service = EmailService(mock_mode=True)
