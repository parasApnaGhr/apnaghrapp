# Cashfree Payment Service
from cashfree_pg.api_client import Cashfree
from cashfree_pg.models.create_order_request import CreateOrderRequest
from cashfree_pg.models.customer_details import CustomerDetails
from cashfree_pg.models.order_meta import OrderMeta
from typing import Optional, Dict, Any
from decimal import Decimal
import logging
import os
import uuid

logger = logging.getLogger(__name__)

class CashfreePaymentService:
    def __init__(self):
        """Initialize Cashfree service with credentials from environment."""
        self.app_id = os.environ.get('CASHFREE_APP_ID')
        self.secret_key = os.environ.get('CASHFREE_SECRET_KEY')
        self.environment = os.environ.get('CASHFREE_ENVIRONMENT', 'SANDBOX')
        self.api_version = "2023-08-01"
        
        # Set environment - PRODUCTION or SANDBOX
        if self.environment == "PRODUCTION":
            self.cashfree_env = Cashfree.PRODUCTION
        else:
            self.cashfree_env = Cashfree.SANDBOX
        
        # Create Cashfree instance
        self.cashfree = Cashfree(
            XEnvironment=self.cashfree_env,
            XClientId=self.app_id,
            XClientSecret=self.secret_key
        )
        
        logger.info(f"Cashfree service initialized with environment: {self.environment}")
    
    def generate_order_id(self) -> str:
        """Generate unique order ID."""
        return f"apnaghr_{uuid.uuid4().hex[:12]}"
    
    async def create_order(
        self,
        order_amount: float,
        customer_id: str,
        customer_phone: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        return_url: str = None,
        notify_url: str = None,
        order_note: Optional[str] = None,
        order_tags: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a payment order in Cashfree.
        
        Args:
            order_amount: Amount in INR
            customer_id: Unique customer identifier
            customer_phone: 10-digit phone number
            customer_email: Customer email address
            customer_name: Customer name
            return_url: URL to redirect after payment
            notify_url: Webhook URL for notifications
            order_note: Optional order note
            order_tags: Optional dictionary with order metadata
            
        Returns:
            Dictionary containing order details including payment_session_id
        """
        try:
            order_id = self.generate_order_id()
            
            # Create customer details object
            customer_details = CustomerDetails(
                customer_id=customer_id[:50],  # Cashfree limits to 50 chars
                customer_phone=customer_phone,
                customer_email=customer_email or f"{customer_id[:20]}@apnaghr.com",
                customer_name=customer_name or "ApnaGhr Customer"
            )
            
            # Create order metadata
            order_meta = OrderMeta(
                return_url=return_url,
                notify_url=notify_url
            )
            
            # Filter out empty string values from order_tags
            clean_tags = None
            if order_tags:
                clean_tags = {k: str(v) for k, v in order_tags.items() if v}
            
            # Create order request
            create_order_request = CreateOrderRequest(
                order_id=order_id,
                order_amount=float(order_amount),
                order_currency="INR",
                customer_details=customer_details,
                order_meta=order_meta,
                order_note=order_note,
                order_tags=clean_tags
            )
            
            # Call Cashfree API
            api_response = self.cashfree.PGCreateOrder(
                x_api_version=self.api_version,
                create_order_request=create_order_request
            )
            
            if api_response and api_response.data:
                order_data = api_response.data
                logger.info(f"Order created successfully: {order_data.order_id}")
                
                return {
                    'order_id': order_data.order_id,
                    'cf_order_id': str(order_data.cf_order_id) if order_data.cf_order_id else None,
                    'payment_session_id': order_data.payment_session_id,
                    'order_amount': order_data.order_amount,
                    'order_currency': order_data.order_currency,
                    'order_status': order_data.order_status,
                    'created_at': str(order_data.created_at) if order_data.created_at else None,
                    'order_expiry_time': str(order_data.order_expiry_time) if order_data.order_expiry_time else None
                }
            else:
                raise Exception("Failed to create order - no response data")
                
        except Exception as e:
            logger.error(f"Error creating Cashfree order: {str(e)}")
            raise
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """
        Fetch order status from Cashfree.
        
        Args:
            order_id: Order ID to fetch
            
        Returns:
            Dictionary containing order details and status
        """
        try:
            api_response = self.cashfree.PGFetchOrder(
                x_api_version=self.api_version,
                order_id=order_id
            )
            
            if api_response and api_response.data:
                order_data = api_response.data
                logger.info(f"Order status fetched: {order_id} - {order_data.order_status}")
                
                return {
                    'order_id': order_data.order_id,
                    'cf_order_id': str(order_data.cf_order_id) if order_data.cf_order_id else None,
                    'order_amount': order_data.order_amount,
                    'order_currency': order_data.order_currency,
                    'order_status': order_data.order_status,
                    'payment_session_id': getattr(order_data, 'payment_session_id', None)
                }
            else:
                raise Exception(f"Order {order_id} not found")
                
        except Exception as e:
            logger.error(f"Error fetching order {order_id}: {str(e)}")
            raise
    
    async def get_payments_for_order(self, order_id: str) -> list:
        """
        Get all payments for an order.
        
        Args:
            order_id: Order ID to fetch payments for
            
        Returns:
            List of payment details
        """
        try:
            api_response = self.cashfree.PGOrderFetchPayments(
                x_api_version=self.api_version,
                order_id=order_id
            )
            
            if api_response and api_response.data:
                payments = []
                for payment in api_response.data:
                    payments.append({
                        'cf_payment_id': payment.cf_payment_id,
                        'payment_status': payment.payment_status,
                        'payment_amount': payment.payment_amount,
                        'payment_currency': payment.payment_currency,
                        'payment_time': str(payment.payment_time) if payment.payment_time else None,
                        'payment_method': payment.payment_method
                    })
                return payments
            return []
                
        except Exception as e:
            logger.error(f"Error fetching payments for order {order_id}: {str(e)}")
            return []
    
    def verify_webhook_signature(self, signature: str, timestamp: str, raw_body: bytes) -> bool:
        """
        Verify Cashfree webhook signature.
        
        Args:
            signature: The x-webhook-signature header value
            timestamp: The x-webhook-timestamp header value
            raw_body: Raw request body bytes
            
        Returns:
            True if signature is valid, False otherwise
        """
        import hmac
        import hashlib
        import base64
        
        try:
            signed_payload = f"{timestamp}.{raw_body.decode('utf-8')}"
            expected_signature = base64.b64encode(
                hmac.new(
                    self.secret_key.encode('utf-8'),
                    signed_payload.encode('utf-8'),
                    hashlib.sha256
                ).digest()
            ).decode('utf-8')
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False


# Singleton instance
_cashfree_service = None

def get_cashfree_service() -> CashfreePaymentService:
    global _cashfree_service
    if _cashfree_service is None:
        _cashfree_service = CashfreePaymentService()
    return _cashfree_service
