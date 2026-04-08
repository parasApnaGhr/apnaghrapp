"""
Pydantic Models for ApnaGhr Visit Platform
All request/response models in one place for easy import
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ============ USER MODELS ============

class User(BaseModel):
    id: str = ""
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str
    is_online: bool = False
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    last_location_update: Optional[datetime] = None
    created_at: datetime = None
    
    def __init__(self, **data):
        import uuid
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())
        if not data.get('created_at'):
            from datetime import timezone
            data['created_at'] = datetime.now(timezone.utc)
        super().__init__(**data)

class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str

class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    role: str
    is_online: bool = False
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    last_location_update: Optional[datetime] = None
    created_at: datetime

class LoginRequest(BaseModel):
    phone: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# ============ AUTH MODELS ============

class TermsAcceptanceRequest(BaseModel):
    accepted_terms: bool = True
    accepted_privacy: bool = True
    accepted_anti_circumvention: bool = True

class ForgotPasswordRequest(BaseModel):
    phone: str
    method: str = "sms"

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ============ PROPERTY MODELS ============

class Property(BaseModel):
    id: str = ""
    title: str
    description: Optional[str] = None
    property_type: str
    bhk: Optional[str] = None
    rent: float
    deposit: Optional[float] = None
    area_name: str
    city: str
    full_address: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    amenities: List[str] = []
    is_available: bool = True
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    furnished: Optional[str] = None
    floor: Optional[str] = None
    total_floors: Optional[int] = None
    facing: Optional[str] = None
    age: Optional[str] = None
    parking: Optional[str] = None
    water_supply: Optional[str] = None
    power_backup: Optional[str] = None
    is_verified: bool = False
    is_hot: bool = False
    added_by: Optional[str] = None
    created_at: datetime = None
    
    def __init__(self, **data):
        import uuid
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())
        if not data.get('created_at'):
            from datetime import timezone
            data['created_at'] = datetime.now(timezone.utc)
        super().__init__(**data)

class PropertyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: str
    bhk: Optional[str] = None
    rent: float
    deposit: Optional[float] = None
    area_name: str
    city: str
    full_address: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    amenities: List[str] = []
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    furnished: Optional[str] = None
    floor: Optional[str] = None
    total_floors: Optional[int] = None
    facing: Optional[str] = None
    age: Optional[str] = None
    parking: Optional[str] = None
    water_supply: Optional[str] = None
    power_backup: Optional[str] = None

class PropertyStatusUpdate(BaseModel):
    is_available: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_hot: Optional[bool] = None

class PropertyLocationUpdate(BaseModel):
    latitude: float
    longitude: float

# ============ VISIT MODELS ============

class VisitPackage(BaseModel):
    id: str = ""
    name: str
    total_visits: int
    price: float
    valid_days: int
    created_at: datetime = None

class VisitBooking(BaseModel):
    id: str = ""
    customer_id: str
    property_ids: List[str]
    scheduled_date: str
    scheduled_time: str
    status: str = "pending"
    rider_id: Optional[str] = None
    amount_paid: float = 0
    created_at: datetime = None

class VisitBookingCreate(BaseModel):
    property_ids: List[str]
    scheduled_date: str
    scheduled_time: str
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    referral_code: Optional[str] = None

class VisitStepUpdate(BaseModel):
    step: str
    property_id: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class PropertyLock(BaseModel):
    property_id: str
    locked_by: str
    locked_at: datetime
    expires_at: datetime

# ============ RIDER MODELS ============

class RiderShiftUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None

class RiderApplicationCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    city: str
    experience: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    documents: List[str] = []

class RiderBankDetails(BaseModel):
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    branch: Optional[str] = None
    upi_id: Optional[str] = None

# ============ PAYMENT MODELS ============

class PaymentTransaction(BaseModel):
    id: str = ""
    user_id: str
    amount: float
    payment_type: str
    payment_status: str = "pending"
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime = None

class CheckoutRequest(BaseModel):
    property_ids: List[str]
    scheduled_date: str
    scheduled_time: str
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    referral_code: Optional[str] = None
    package_id: Optional[str] = None

# ============ CHAT MODELS ============

class ChatMessage(BaseModel):
    id: str = ""
    session_id: str
    role: str
    content: str
    created_at: datetime = None

class ChatMessageCreate(BaseModel):
    session_id: Optional[str] = None
    message: str

# ============ TOLET TASK MODELS ============

class ToLetTask(BaseModel):
    id: str = ""
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    created_by: str
    created_at: datetime = None

class ToLetTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None

class ToLetTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None

# ============ CUSTOMER MODELS ============

class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

# ============ NOTIFICATION MODELS ============

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"
    data: Optional[dict] = None

# ============ ADMIN MODELS ============

class ManualVisitCreate(BaseModel):
    customer_name: str
    customer_phone: str
    property_ids: List[str]
    scheduled_date: str
    scheduled_time: str
    pickup_location: Optional[str] = None
    notes: Optional[str] = None

class AssignRiderRequest(BaseModel):
    rider_id: str

class AdminStatsRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
