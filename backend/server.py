from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
import json
import math

# Custom JSON encoder that handles MongoDB ObjectId and other non-serializable types
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def sanitize_mongo_doc(doc):
    """Remove or convert non-serializable fields from MongoDB documents"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [sanitize_mongo_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip _id completely
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = sanitize_mongo_doc(value)
            elif isinstance(value, list):
                result[key] = sanitize_mongo_doc(value)
            else:
                result[key] = value
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

# Haversine formula to calculate distance between two coordinates
def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula"""
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')  # If any coordinate is missing, return infinity
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# Maximum radius for riders to see available visits (in km)
RIDER_MAX_RADIUS_KM = 50

# Import new modular routes
from routes.packers import router as packers_router
from routes.advertising import router as advertising_router
from routes.chatbot import setup_chatbot_routes
from routes.seller import setup_seller_routes
from routes.tracking import router as tracking_router, set_database as set_tracking_db
from routes.builder import router as builder_router, set_database as set_builder_db
from routes.leads import router as leads_router, set_database as set_leads_db
from routes.seller_leads import router as seller_leads_router, set_database as set_seller_leads_db
from routes.ai_validation import router as ai_validation_router, set_database as set_ai_validation_db
from routes.seller_performance import router as seller_performance_router, set_database as set_seller_performance_db
from routes.inventory_access import router as inventory_access_router
from routes.seller_verification import router as seller_verification_router
from services.cashfree_service import get_cashfree_service, CashfreePaymentService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Set database for modular routes
set_tracking_db(db)
set_builder_db(db)
set_leads_db(db)
set_seller_leads_db(db)
set_ai_validation_db(db)
set_seller_performance_db(db)

app = FastAPI(title="ApnaGhr Visit Platform", version="2.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

# Payment packages
PAYMENT_PACKAGES = {
    "single_visit": {"amount": 200.0, "visits": 1, "validity_days": 3, "type": "visit"},
    "three_visits": {"amount": 350.0, "visits": 3, "validity_days": 7, "type": "visit"},
    "five_visits": {"amount": 500.0, "visits": 5, "validity_days": 10, "type": "visit"},
    "property_lock": {"amount": 999.0, "type": "lock"},
    # Packers packages - using minimum price for checkout
    "packers_basic": {"amount": 2999.0, "type": "packers", "tier": "basic"},
    "packers_standard": {"amount": 5999.0, "type": "packers", "tier": "standard"},
    "packers_premium": {"amount": 10999.0, "type": "packers", "tier": "premium"},
    "packers_elite": {"amount": 18999.0, "type": "packers", "tier": "elite"},
    "packers_intercity": {"amount": 15000.0, "type": "packers", "tier": "intercity"},
    # Advertising packages - monthly subscription
    "ads_starter": {"amount": 2999.0, "type": "advertising", "tier": "starter"},
    "ads_growth": {"amount": 7999.0, "type": "advertising", "tier": "growth"},
    "ads_premium": {"amount": 14999.0, "type": "advertising", "tier": "premium"},
    "ads_elite": {"amount": 29999.0, "type": "advertising", "tier": "elite"},
}

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str
    is_online: bool = False  # For rider shift system
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    last_location_update: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    property_type: str
    bhk: int
    rent: float
    furnishing: str
    area_name: str
    city: str
    exact_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    video_url: Optional[str] = None
    amenities: List[str] = []
    available: bool = True
    verified_owner: bool = False
    premium_listing: bool = False
    # Owner contact for internal staff verification (NOT shown to customers/riders)
    owner_contact: Optional[str] = None
    owner_name: Optional[str] = None
    # Analytics & Status Tracking
    visit_count: int = 0
    weekly_visits: int = 0
    last_visited: Optional[str] = None
    status: str = "available"  # available, rented, under_verification, inactive
    last_status_check: Optional[str] = None
    status_verified_by: Optional[str] = None
    status_notes: Optional[str] = None
    is_hot: bool = False  # High demand property
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PropertyStatusUpdate(BaseModel):
    status: str  # available, rented, under_verification, inactive
    notes: Optional[str] = None

class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: str
    bhk: int
    rent: float
    furnishing: str
    area_name: str
    city: str
    exact_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    video_url: Optional[str] = None
    amenities: List[str] = []
    # Owner contact for internal staff verification
    owner_contact: Optional[str] = None
    owner_name: Optional[str] = None

class VisitPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    package_type: str
    total_visits: int
    visits_used: int = 0
    amount_paid: float
    valid_until: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    property_ids: List[str] = []  # Multiple properties support
    package_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    status: str = "pending"  # pending, rider_assigned, pickup_started, at_customer, navigating, at_property, completed, cancelled
    current_step: str = "waiting"  # waiting, go_to_customer, at_customer, go_to_property_X, at_property_X, completed
    current_property_index: int = 0  # Which property in the list we're at
    rider_id: Optional[str] = None
    otp: Optional[str] = None
    total_properties: int = 1
    total_earnings: float = 0.0
    estimated_duration: str = ""
    pickup_location: str = ""  # Customer pickup location
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    properties_completed: List[str] = []  # Track which properties are done
    property_proofs: Dict = {}  # {property_id: {selfie: url, video: url}}
    visit_start_time: Optional[datetime] = None
    visit_end_time: Optional[datetime] = None
    customer_feedback: Optional[str] = None
    rating: Optional[int] = None
    # Seller referral tracking
    referred_by: Optional[str] = None  # Seller ID who referred this client
    deal_closed: bool = False
    brokerage_amount: Optional[float] = None
    seller_commission: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitBookingCreate(BaseModel):
    property_ids: List[str]  # Can book multiple properties
    package_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    pickup_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    referral_code: Optional[str] = None  # Optional seller referral code

class RiderShiftUpdate(BaseModel):
    is_online: bool
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class VisitStepUpdate(BaseModel):
    action: str  # start_pickup, arrived_customer, start_property, arrived_property, complete_property, complete_visit

class PropertyLock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    property_id: str
    amount_paid: float = 999.0
    status: str = "locked"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    payment_id: Optional[str] = None
    amount: float
    currency: str
    package_type: str
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    message: str
    visit_id: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    receiver_id: str
    message: str
    visit_id: Optional[str] = None

# ============ NEW MODELS FOR ADMIN FEATURES ============
# NOTE: Lead and Builder models moved to /routes/leads.py and /routes/builder.py

class ToLetTask(BaseModel):
    """Task for collecting ToLet boards from properties"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rate_per_board: float = 10.0  # Editable rate
    estimated_boards: int = 1
    actual_boards_collected: int = 0
    status: str = "open"  # open, assigned, in_progress, completed, verified, rejected
    rider_id: Optional[str] = None
    assigned_by: Optional[str] = None
    proof_images: List[str] = []
    proof_video: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    earnings: float = 0.0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ToLetTaskCreate(BaseModel):
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rate_per_board: float = 10.0
    estimated_boards: int = 1

class ToLetTaskUpdate(BaseModel):
    rate_per_board: Optional[float] = None
    estimated_boards: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

class ToLetTaskComplete(BaseModel):
    boards_collected: int
    proof_images: List[str]  # Required - one image per board
    proof_video: Optional[str] = None
    notes: Optional[str] = None

class RiderWallet(BaseModel):
    """Rider's earnings wallet"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rider_id: str
    total_earnings: float = 0.0
    pending_earnings: float = 0.0  # Awaiting admin approval
    approved_earnings: float = 0.0  # Approved but not paid
    paid_earnings: float = 0.0  # Already paid out
    last_payout_date: Optional[str] = None
    next_payout_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RiderTransaction(BaseModel):
    """Individual transaction record"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rider_id: str
    type: str  # visit_earning, tolet_earning, bonus, deduction, payout
    amount: float
    status: str = "pending"  # pending, approved, rejected, paid
    reference_id: Optional[str] = None  # visit_id or tolet_task_id
    reference_type: Optional[str] = None  # visit, tolet_task, bonus
    description: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    """Notification for admin/rider"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # who receives
    type: str  # ride_started, ride_ended, visit_completed, tolet_completed, payment_approved
    title: str
    message: str
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitApproval(BaseModel):
    """For admin to approve/reject visits"""
    approved: bool
    rejection_reason: Optional[str] = None

class AssignRider(BaseModel):
    """Assign a visit/task to specific rider"""
    rider_id: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"phone": user_data.phone}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_pw = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_pw
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Return user without password
    return UserResponse(
        id=user_obj.id,
        name=user_obj.name,
        phone=user_obj.phone,
        email=user_obj.email,
        role=user_obj.role,
        is_online=user_obj.is_online,
        current_lat=user_obj.current_lat,
        current_lng=user_obj.current_lng,
        last_location_update=user_obj.last_location_update,
        created_at=user_obj.created_at
    )

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"phone": login_data.phone}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['role'])
    user.pop('password', None)
    
    # Include terms acceptance status in response
    user['terms_accepted'] = user.get('terms_accepted', False)
    user['terms_accepted_date'] = user.get('terms_accepted_date', None)
    
    return {"token": token, "user": user}


# ============ TERMS & CONDITIONS ACCEPTANCE ============

class TermsAcceptanceRequest(BaseModel):
    accepted_terms: bool = True
    accepted_privacy: bool = True
    accepted_anti_circumvention: bool = True

@api_router.post("/auth/accept-terms")
async def accept_terms(request: TermsAcceptanceRequest, current_user: dict = Depends(get_current_user)):
    """Accept terms and conditions - stored permanently in database"""
    if not all([request.accepted_terms, request.accepted_privacy, request.accepted_anti_circumvention]):
        raise HTTPException(status_code=400, detail="All terms must be accepted")
    
    # Update user record with terms acceptance
    result = await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "terms_accepted": True,
            "terms_accepted_date": datetime.now(timezone.utc).isoformat(),
            "terms_version": "1.0",
            "accepted_terms": True,
            "accepted_privacy": True,
            "accepted_anti_circumvention": True
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "status": "success",
        "message": "Terms and conditions accepted successfully",
        "terms_accepted": True,
        "terms_accepted_date": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/auth/terms-status")
async def get_terms_status(current_user: dict = Depends(get_current_user)):
    """Check if user has accepted terms"""
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "terms_accepted": 1, "terms_accepted_date": 1, "terms_version": 1})
    
    return {
        "terms_accepted": user.get('terms_accepted', False) if user else False,
        "terms_accepted_date": user.get('terms_accepted_date', None) if user else None,
        "terms_version": user.get('terms_version', None) if user else None
    }


# ============ FORGOT PASSWORD ============
import secrets
import random
from services.notification_service import send_sms_otp, send_email_otp, get_notification_status

class ForgotPasswordRequest(BaseModel):
    phone: str
    method: str = "sms"  # sms or email

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str

# ============================================
# RIDER ONBOARDING MODELS - New Module
# ============================================

class RiderApplicationBasicDetails(BaseModel):
    full_name: str
    mobile: str
    whatsapp: Optional[str] = None
    city: str
    areas: List[str] = []

class RiderApplicationKYC(BaseModel):
    aadhaar_url: str
    pan_url: Optional[str] = None
    selfie_url: str

class RiderApplicationWorkDetails(BaseModel):
    has_vehicle: bool = False
    driving_license_url: Optional[str] = None
    experience: Optional[str] = None
    availability: str = "full_time"  # full_time, part_time, weekends

class RiderApplicationPayment(BaseModel):
    upi_id: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None

class RiderApplicationLegalAgreements(BaseModel):
    non_circumvention: bool = False
    commission_protection: bool = False
    penalty_clause: bool = False
    work_compliance: bool = False
    payment_terms: bool = False
    agreed_at: Optional[str] = None

class RiderApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Basic Details
    full_name: str
    mobile: str
    whatsapp: Optional[str] = None
    city: str
    areas: List[str] = []
    # KYC
    aadhaar_url: Optional[str] = None
    pan_url: Optional[str] = None
    selfie_url: Optional[str] = None
    # Work Details
    has_vehicle: bool = False
    driving_license_url: Optional[str] = None
    experience: Optional[str] = None
    availability: str = "full_time"
    # Payment
    upi_id: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    # Legal Agreements
    legal_agreements: Optional[RiderApplicationLegalAgreements] = None
    # Application Status
    status: str = "pending"  # pending, under_review, approved, rejected, banned
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    # Tracking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    # Linked user (after approval)
    user_id: Optional[str] = None

class RiderApplicationCreate(BaseModel):
    # Basic Details
    full_name: str
    mobile: str
    whatsapp: Optional[str] = None
    city: str
    areas: List[str] = []
    # KYC
    aadhaar_url: str
    pan_url: Optional[str] = None
    selfie_url: str
    # Work Details
    has_vehicle: bool = False
    driving_license_url: Optional[str] = None
    experience: Optional[str] = None
    availability: str = "full_time"
    # Payment
    upi_id: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    # Legal Agreements
    non_circumvention: bool
    commission_protection: bool
    penalty_clause: bool
    work_compliance: bool
    payment_terms: bool

class RiderApplicationReview(BaseModel):
    status: str  # approved, rejected
    rejection_reason: Optional[str] = None

# ============================================
# END RIDER ONBOARDING MODELS
# ============================================

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset OTP via SMS or Email"""
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    if not user:
        # Don't reveal if user exists - still return success
        return {"message": "If this account exists, an OTP has been sent", "method": request.method}
    
    # Generate 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP with 10 min expiry
    otp_doc = {
        "phone": request.phone,
        "otp": otp,
        "method": request.method,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "used": False
    }
    
    # Remove any existing OTPs for this phone
    await db.password_reset_otps.delete_many({"phone": request.phone})
    await db.password_reset_otps.insert_one(otp_doc)
    
    # Send OTP via selected method
    response_data = {
        "message": "OTP sent successfully",
        "method": request.method,
        "expires_in_minutes": 10
    }
    
    if request.method == "email":
        if not user.get('email'):
            raise HTTPException(status_code=400, detail="No email address registered. Please use SMS.")
        
        result = await send_email_otp(
            email=user['email'],
            otp=otp,
            user_name=user.get('name', 'User')
        )
        response_data["email_masked"] = user['email'][:3] + "***" + user['email'][user['email'].find('@'):]
        
        # Include OTP for testing if in dev mode
        if result.get('otp_for_testing'):
            response_data["otp_for_testing"] = result['otp_for_testing']
            response_data["dev_mode"] = True
    else:
        # SMS
        result = await send_sms_otp(phone=request.phone, otp=otp)
        
        # Include OTP for testing if in dev mode
        if result.get('otp_for_testing'):
            response_data["otp_for_testing"] = result['otp_for_testing']
            response_data["dev_mode"] = True
    
    return response_data


@api_router.get("/auth/notification-status")
async def notification_status():
    """Check SMS/Email service status"""
    return get_notification_status()


@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP before allowing password reset"""
    otp_doc = await db.password_reset_otps.find_one({
        "phone": request.phone,
        "otp": request.otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Check if expired
    expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store reset token with 5 min expiry
    await db.password_reset_tokens.delete_many({"phone": request.phone})
    await db.password_reset_tokens.insert_one({
        "phone": request.phone,
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    })
    
    return {"valid": True, "reset_token": reset_token, "message": "OTP verified. You can now reset your password."}


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password after OTP verification"""
    # Verify OTP again
    otp_doc = await db.password_reset_otps.find_one({
        "phone": request.phone,
        "otp": request.otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Check if expired
    expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Validate password
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password
    hashed_pw = hash_password(request.new_password)
    result = await db.users.update_one(
        {"phone": request.phone},
        {"$set": {"password": hashed_pw}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark OTP as used
    await db.password_reset_otps.update_one(
        {"phone": request.phone, "otp": request.otp},
        {"$set": {"used": True}}
    )
    
    # Clean up
    await db.password_reset_tokens.delete_many({"phone": request.phone})
    
    return {"message": "Password reset successfully. You can now login with your new password."}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change password for logged-in user"""
    # Get user with password
    user = await db.users.find_one({"id": current_user['id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(request.current_password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update password
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"password": new_hashed}}
    )
    
    return {"success": True, "message": "Password changed successfully"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

# Serve images from MongoDB GridFS
@api_router.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve image from MongoDB GridFS storage"""
    from services.image_storage import get_image_storage
    from fastapi.responses import Response
    
    storage = await get_image_storage(db)
    content, content_type = await storage.get_image(filename)
    
    if content is None:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return Response(
        content=content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )

# Health check endpoint (under /api)
@api_router.get("/health")
async def api_health_check():
    """Health check endpoint accessible via /api/health"""
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected", "version": "2.0"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Manual seed endpoint for production database
@api_router.post("/admin/seed-database")
async def seed_production_database(secret_key: str = None):
    """
    Manually seed the production database with initial data.
    This endpoint can be called once to populate an empty production database.
    Requires a secret key for security.
    """
    # Simple security check - use environment variable or hardcoded key
    expected_key = os.environ.get('SEED_SECRET', 'apnaghr-seed-2026')
    if secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid seed key")
    
    try:
        # Check if database already has data
        user_count = await db.users.count_documents({})
        property_count = await db.properties.count_documents({})
        
        if user_count > 0 and property_count > 0:
            return {
                "status": "skipped",
                "message": "Database already has data",
                "counts": {"users": user_count, "properties": property_count}
            }
        
        # Load seed data
        seed_file = ROOT_DIR / "seed_data.json"
        if not seed_file.exists():
            raise HTTPException(status_code=500, detail="Seed data file not found")
        
        with open(seed_file) as f:
            seed_data = json.load(f)
        
        results = {}
        
        # Seed users (with password hashing)
        if 'users' in seed_data and await db.users.count_documents({}) == 0:
            users = seed_data['users']
            for user in users:
                # Hash password if not already hashed
                if not user.get('password', '').startswith('$2'):
                    user['password'] = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                user['created_at'] = datetime.now(timezone.utc)
            await db.users.insert_many(users)
            results['users'] = len(users)
        
        # Seed properties
        if 'properties' in seed_data and await db.properties.count_documents({}) == 0:
            properties = seed_data['properties']
            for prop in properties:
                prop['created_at'] = datetime.now(timezone.utc)
            await db.properties.insert_many(properties)
            results['properties'] = len(properties)
        
        # Seed advertisements
        if 'advertisements' in seed_data and await db.advertisements.count_documents({}) == 0:
            ads = seed_data['advertisements']
            for ad in ads:
                ad['created_at'] = datetime.now(timezone.utc)
            await db.advertisements.insert_many(ads)
            results['advertisements'] = len(ads)
        
        # Seed app_settings
        if 'app_settings' in seed_data and await db.app_settings.count_documents({}) == 0:
            settings = seed_data['app_settings']
            await db.app_settings.insert_many(settings)
            results['app_settings'] = len(settings)
        
        return {
            "status": "success",
            "message": "Database seeded successfully",
            "inserted": results
        }
        
    except Exception as e:
        logger.error(f"Seed error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")

# Data integrity check endpoint for admin
@api_router.get("/admin/data-status")
async def get_data_status(current_user: dict = Depends(get_current_user)):
    """Check the status of all data collections - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        status = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "collections": {},
            "images": {"external": 0, "local": 0, "mongodb": 0},
            "health": "ok"
        }
        
        # Check all collections
        collections = ['users', 'properties', 'advertisements', 'visit_bookings', 
                      'payment_transactions', 'rider_wallets', 'tolet_tasks', 'notifications']
        
        for coll_name in collections:
            count = await db[coll_name].count_documents({})
            status["collections"][coll_name] = count
        
        # Check image URLs in properties
        properties = await db.properties.find({}, {"_id": 0, "images": 1}).to_list(100)
        for p in properties:
            for img in p.get('images', []):
                if img.startswith('https://'):
                    status["images"]["external"] += 1
                elif img.startswith('/api/images/'):
                    status["images"]["mongodb"] += 1
                else:
                    status["images"]["local"] += 1
        
        # Set health status
        if status["images"]["local"] > 0:
            status["health"] = "warning"
            status["warning"] = f"{status['images']['local']} images use local storage"
        
        return status
        
    except Exception as e:
        return {"health": "error", "error": str(e)}

@api_router.get("/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'support_admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).limit(100).to_list(None)
    return users

# Property endpoints
@api_router.post("/properties")
async def create_property(property_data: PropertyCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    property_obj = Property(**property_data.model_dump())
    doc = property_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.properties.insert_one(doc)
    
    doc.pop('_id', None)
    return doc

@api_router.patch("/properties/{property_id}")
async def update_property(property_id: str, available: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.properties.update_one({"id": property_id}, {"$set": {"available": available}})
    return {"success": True, "available": available}

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"success": True, "message": "Property deleted"}

@api_router.get("/properties")
async def get_properties(
    city: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    bhk: Optional[int] = None,
    furnishing: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"available": True}
    
    # Case-insensitive partial match for city/area_name
    if city:
        query["$or"] = [
            {"city": {"$regex": city, "$options": "i"}},
            {"area_name": {"$regex": city, "$options": "i"}}
        ]
    
    # Rent range filter
    if min_rent or max_rent:
        query["rent"] = {}
        if min_rent:
            query["rent"]["$gte"] = min_rent
        if max_rent:
            query["rent"]["$lte"] = max_rent
    
    if bhk:
        query["bhk"] = bhk
    if furnishing:
        query["furnishing"] = furnishing
    
    properties = await db.properties.find(query, {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0, "owner_contact": 0, "owner_name": 0}).limit(50).to_list(None)
    return properties

# PUBLIC endpoint - no auth required for viewing property (for shared links)
@api_router.get("/public/property/{property_id}")
async def get_public_property(property_id: str):
    """Get property details without authentication - for shared links"""
    property_data = await db.properties.find_one(
        {"id": property_id}, 
        {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0, "owner_phone": 0, "owner_contact": 0, "owner_name": 0}
    )
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_data

# ============================================
# SEO Module Endpoints - READ-ONLY, PUBLIC
# No database modifications, only read operations
# ============================================

@api_router.get("/seo/properties")
async def get_seo_properties(
    city: Optional[str] = None,
    area: Optional[str] = None,
    bedrooms: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    listing_type: Optional[str] = "rent",
    limit: int = 50
):
    """
    SEO-friendly property listing endpoint - PUBLIC, read-only
    Returns properties for SEO pages without sensitive data
    """
    # Match properties that are available or under verification (visible to public)
    query = {"status": {"$in": ["available", "under_verification"]}}
    
    if city:
        # Case-insensitive city search
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    
    if area:
        # Search in both area_name and location fields
        query["$or"] = [
            {"area_name": {"$regex": area, "$options": "i"}},
            {"location": {"$regex": area, "$options": "i"}}
        ]
    
    if bedrooms is not None:
        query["bedrooms"] = bedrooms
    
    # Price filtering based on listing type
    if listing_type == "rent":
        if min_price is not None or max_price is not None:
            query["rent"] = {}
            if min_price is not None:
                query["rent"]["$gte"] = min_price
            if max_price is not None:
                query["rent"]["$lte"] = max_price
    elif listing_type == "buy":
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None:
                query["price"]["$gte"] = min_price
            if max_price is not None:
                query["price"]["$lte"] = max_price
    
    # Projection: exclude sensitive data
    projection = {
        "_id": 0,
        "exact_address": 0,
        "latitude": 0,
        "longitude": 0,
        "owner_phone": 0,
        "owner_id": 0
    }
    
    properties = await db.properties.find(query, projection).limit(limit).to_list(limit)
    return properties

@api_router.get("/seo/sitemap-data")
async def get_sitemap_data():
    """
    Returns data for generating sitemap - PUBLIC, read-only
    Returns unique cities and property counts for sitemap generation
    """
    # Get unique cities with property counts
    city_pipeline = [
        {"$match": {"status": {"$in": ["available", "under_verification"]}}},
        {"$group": {
            "_id": "$city",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 50}
    ]
    
    cities = await db.properties.aggregate(city_pipeline).to_list(100)
    
    # Get property type distribution
    type_pipeline = [
        {"$match": {"status": {"$in": ["available", "under_verification"]}}},
        {"$group": {
            "_id": "$bedrooms",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    types = await db.properties.aggregate(type_pipeline).to_list(20)
    
    return {
        "cities": [{"name": c["_id"], "count": c["count"]} for c in cities if c["_id"]],
        "property_types": [{"bedrooms": t["_id"], "count": t["count"]} for t in types if t["_id"] is not None],
        "total_properties": await db.properties.count_documents({"status": {"$in": ["available", "under_verification"]}})
    }

@api_router.get("/sitemap.xml")
async def get_sitemap_xml():
    """
    Returns dynamic XML sitemap - PUBLIC endpoint
    """
    site_url = "https://apnaghrapp.in"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # All 60 cities
    cities = [
        "delhi", "mumbai", "bangalore", "chennai", "kolkata", "hyderabad", "pune", "ahmedabad",
        "jaipur", "lucknow", "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam",
        "patna", "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "faridabad", "meerut",
        "rajkot", "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar", "navi-mumbai",
        "allahabad", "ranchi", "howrah", "coimbatore", "jabalpur", "gwalior", "vijayawada",
        "jodhpur", "madurai", "raipur", "kota", "chandigarh", "guwahati", "solapur", "hubli",
        "mysore", "tiruchirappalli", "bareilly", "aligarh", "tiruppur", "moradabad", "jalandhar",
        "bhubaneswar", "salem", "warangal", "guntur", "bhiwandi", "mohali", "bathinda"
    ]
    
    property_types = ["flats", "1bhk", "2bhk", "3bhk", "4bhk", "studio", "villa"]
    listing_types = ["rent", "buy"]
    
    # Blog slugs (static list)
    blog_slugs = [
        "how-to-find-perfect-rental-home-mohali",
        "top-10-localities-chandigarh-tricity-2025",
        "vastu-tips-new-home-buyers",
        "rental-agreement-checklist-india",
        "first-time-home-buyer-guide-india"
    ]
    
    urls = []
    
    # Static pages
    urls.append({"loc": f"{site_url}/", "priority": "1.0", "changefreq": "daily"})
    urls.append({"loc": f"{site_url}/blog", "priority": "0.9", "changefreq": "daily"})
    urls.append({"loc": f"{site_url}/sitemap", "priority": "0.5", "changefreq": "weekly"})
    urls.append({"loc": f"{site_url}/legal", "priority": "0.3", "changefreq": "monthly"})
    urls.append({"loc": f"{site_url}/join-as-rider", "priority": "0.8", "changefreq": "weekly"})
    urls.append({"loc": f"{site_url}/earn-money-by-visiting-properties", "priority": "0.9", "changefreq": "weekly"})
    urls.append({"loc": f"{site_url}/earn-2000-per-day-real-estate", "priority": "0.8", "changefreq": "weekly"})
    
    # City SEO pages
    for city in cities:
        # Rider earning pages
        urls.append({"loc": f"{site_url}/become-property-rider/{city}", "priority": "0.8", "changefreq": "weekly"})
        
        # Property pages
        for listing_type in listing_types:
            for prop_type in property_types:
                urls.append({"loc": f"{site_url}/{listing_type}/{prop_type}-in-{city}", "priority": "0.7", "changefreq": "weekly"})
    
    # Blog pages
    for slug in blog_slugs:
        urls.append({"loc": f"{site_url}/blog/{slug}", "priority": "0.7", "changefreq": "monthly"})
    
    # Build XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls:
        xml += '  <url>\n'
        xml += f'    <loc>{url["loc"]}</loc>\n'
        xml += f'    <lastmod>{today}</lastmod>\n'
        xml += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{url["priority"]}</priority>\n'
        xml += '  </url>\n'
    
    xml += '</urlset>'
    
    return Response(content=xml, media_type="application/xml")


@api_router.get("/robots.txt")
async def get_robots_txt():
    """
    Returns robots.txt for search engines - PUBLIC endpoint
    """
    robots_content = """# ApnaGhr Robots.txt
# Allow all search engines to crawl

User-agent: *
Allow: /

# Sitemap location
Sitemap: https://apnaghrapp.in/api/sitemap.xml

# Crawl-delay (be nice to servers)
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin
Disallow: /api/admin
Disallow: /rider
Disallow: /customer
Disallow: /seller
"""
    return Response(content=robots_content, media_type="text/plain")

# ============================================
# End SEO Module Endpoints
# ============================================

# ============================================
# RIDER ONBOARDING ENDPOINTS - New Module
# Public endpoints for rider applications
# ============================================

@api_router.post("/rider-applications")
async def create_rider_application(application: RiderApplicationCreate):
    """
    Submit a new rider application - PUBLIC endpoint
    No authentication required for initial submission
    """
    # Check if mobile already has a pending/approved application
    existing = await db.rider_applications.find_one({
        "mobile": application.mobile,
        "status": {"$in": ["pending", "under_review", "approved"]}
    })
    if existing:
        if existing.get("status") == "approved":
            raise HTTPException(status_code=400, detail="You are already a registered rider")
        raise HTTPException(status_code=400, detail="You already have a pending application")
    
    # Check if all legal agreements are accepted
    if not all([
        application.non_circumvention,
        application.commission_protection,
        application.penalty_clause,
        application.work_compliance,
        application.payment_terms
    ]):
        raise HTTPException(status_code=400, detail="All legal agreements must be accepted")
    
    # Create application
    app_data = RiderApplication(
        full_name=application.full_name,
        mobile=application.mobile,
        whatsapp=application.whatsapp,
        city=application.city,
        areas=application.areas,
        aadhaar_url=application.aadhaar_url,
        pan_url=application.pan_url,
        selfie_url=application.selfie_url,
        has_vehicle=application.has_vehicle,
        driving_license_url=application.driving_license_url,
        experience=application.experience,
        availability=application.availability,
        upi_id=application.upi_id,
        bank_name=application.bank_name,
        account_number=application.account_number,
        ifsc_code=application.ifsc_code,
        account_holder_name=application.account_holder_name,
        legal_agreements=RiderApplicationLegalAgreements(
            non_circumvention=application.non_circumvention,
            commission_protection=application.commission_protection,
            penalty_clause=application.penalty_clause,
            work_compliance=application.work_compliance,
            payment_terms=application.payment_terms,
            agreed_at=datetime.now(timezone.utc).isoformat()
        ),
        status="pending"
    )
    
    await db.rider_applications.insert_one(app_data.model_dump())
    
    return {
        "message": "Application submitted successfully. Our team will review and activate your account.",
        "application_id": app_data.id,
        "status": "pending"
    }

@api_router.get("/rider-applications/check/{mobile}")
async def check_rider_application(mobile: str):
    """Check if a mobile number has an existing application"""
    application = await db.rider_applications.find_one(
        {"mobile": mobile},
        {"_id": 0, "id": 1, "status": 1, "created_at": 1}
    )
    if application:
        return {
            "exists": True,
            "status": application.get("status"),
            "application_id": application.get("id")
        }
    return {"exists": False}

@api_router.get("/admin/rider-applications")
async def get_rider_applications(
    status: Optional[str] = None,
    city: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get all rider applications - Admin only"""
    if current_user.get("role") not in ["admin", "rider_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    applications = await db.rider_applications.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.rider_applications.count_documents(query)
    
    return {
        "applications": applications,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/rider-applications/stats")
async def get_rider_application_stats(current_user: dict = Depends(get_current_user)):
    """Get rider application statistics - Admin only"""
    if current_user.get("role") not in ["admin", "rider_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    stats = await db.rider_applications.aggregate(pipeline).to_list(100)
    
    # Get city distribution
    city_pipeline = [
        {"$group": {
            "_id": "$city",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    city_stats = await db.rider_applications.aggregate(city_pipeline).to_list(10)
    
    return {
        "by_status": {s["_id"]: s["count"] for s in stats if s["_id"]},
        "by_city": {c["_id"]: c["count"] for c in city_stats if c["_id"]},
        "total": await db.rider_applications.count_documents({})
    }

@api_router.get("/admin/rider-applications/{application_id}")
async def get_rider_application(application_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific rider application - Admin only"""
    if current_user.get("role") not in ["admin", "rider_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    application = await db.rider_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application

@api_router.patch("/admin/rider-applications/{application_id}/review")
async def review_rider_application(
    application_id: str,
    review: RiderApplicationReview,
    current_user: dict = Depends(get_current_user)
):
    """Approve or reject a rider application - Admin only"""
    if current_user.get("role") not in ["admin", "rider_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    application = await db.rider_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.get("status") not in ["pending", "under_review"]:
        raise HTTPException(status_code=400, detail=f"Cannot review application with status: {application.get('status')}")
    
    update_data = {
        "status": review.status,
        "reviewed_by": current_user.get("id"),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if review.status == "rejected" and review.rejection_reason:
        update_data["rejection_reason"] = review.rejection_reason
    
    # If approved, create a rider user account
    if review.status == "approved":
        # Check if user already exists
        existing_user = await db.users.find_one({"phone": application.get("mobile")})
        if existing_user:
            # Update existing user to rider role
            await db.users.update_one(
                {"phone": application.get("mobile")},
                {"$set": {"role": "rider", "city": application.get("city")}}
            )
            update_data["user_id"] = existing_user.get("id")
        else:
            # Create new rider user
            import secrets
            temp_password = secrets.token_urlsafe(8)
            new_user = {
                "id": str(uuid.uuid4()),
                "name": application.get("full_name"),
                "phone": application.get("mobile"),
                "password": bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "role": "rider",
                "city": application.get("city"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "upi_id": application.get("upi_id"),
                "bank_details": {
                    "bank_name": application.get("bank_name"),
                    "account_number": application.get("account_number"),
                    "ifsc_code": application.get("ifsc_code"),
                    "account_holder_name": application.get("account_holder_name")
                },
                "documents": {
                    "aadhaar_url": application.get("aadhaar_url"),
                    "pan_url": application.get("pan_url"),
                    "selfie_url": application.get("selfie_url"),
                    "driving_license_url": application.get("driving_license_url")
                },
                "areas": application.get("areas", []),
                "availability": application.get("availability"),
                "has_vehicle": application.get("has_vehicle"),
                "legal_agreements": application.get("legal_agreements")
            }
            await db.users.insert_one(new_user)
            update_data["user_id"] = new_user["id"]
            # Note: In production, send temp_password via SMS
    
    await db.rider_applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    return {"message": f"Application {review.status}", "status": review.status}

@api_router.patch("/admin/rider-applications/{application_id}/ban")
async def ban_rider_application(
    application_id: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Ban a rider - Admin only"""
    if current_user.get("role") not in ["admin", "rider_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    application = await db.rider_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {
        "status": "banned",
        "rejection_reason": reason or "Violation of platform policies",
        "reviewed_by": current_user.get("id"),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.rider_applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    # Also ban the user if exists
    if application.get("user_id"):
        await db.users.update_one(
            {"id": application.get("user_id")},
            {"$set": {"status": "banned", "banned_reason": reason}}
        )
    
    return {"message": "Rider banned successfully"}

# ============================================
# END RIDER ONBOARDING ENDPOINTS
# ============================================

@api_router.get("/properties/{property_id}")
async def get_property(property_id: str, current_user: dict = Depends(get_current_user)):
    property_data = await db.properties.find_one({"id": property_id}, {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0, "owner_contact": 0, "owner_name": 0})
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_data

# Payment endpoints - Using Cashfree
class CashfreeCheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    property_id: Optional[str] = None
    booking_id: Optional[str] = None
    ad_id: Optional[str] = None

@api_router.post("/payments/checkout")
async def create_checkout(
    request: CashfreeCheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Cashfree payment checkout session."""
    if request.package_id not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PAYMENT_PACKAGES[request.package_id]
    amount = package["amount"]
    
    # Use origin_url for callbacks - this should be the production domain
    # For webhook, we need to construct the backend URL from the origin
    origin_url = request.origin_url.rstrip('/')
    # The backend API is on the same domain with /api prefix
    webhook_url = f"{origin_url}/api/webhook/cashfree"
    
    # Build metadata - only include non-empty values
    metadata = {
        "user_id": current_user['id'],
        "package_id": request.package_id,
        "type": package.get("type", "visit")
    }
    if request.property_id:
        metadata["property_id"] = request.property_id
    if request.booking_id:
        metadata["booking_id"] = request.booking_id
    if request.ad_id:
        metadata["ad_id"] = request.ad_id
    
    try:
        cashfree_service = get_cashfree_service()
        
        # Generate order_id first so we can use it in return_url
        order_id = cashfree_service.generate_order_id()
        
        order_response = await cashfree_service.create_order_with_id(
            order_id=order_id,
            order_amount=amount,
            customer_id=current_user['id'],
            customer_phone=current_user.get('phone', '9999999999'),
            customer_email=current_user.get('email'),
            customer_name=current_user.get('name'),
            return_url=f"{origin_url}/payment-success?order_id={order_id}",
            notify_url=webhook_url,
            order_note=f"ApnaGhr {request.package_id} payment",
            order_tags=metadata
        )
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            user_id=current_user['id'],
            session_id=order_response['order_id'],
            payment_id=order_response.get('cf_order_id'),
            amount=amount,
            currency="inr",
            package_type=request.package_id,
            payment_status="pending",
            metadata=metadata
        )
        
        trans_doc = transaction.model_dump()
        trans_doc['created_at'] = trans_doc['created_at'].isoformat()
        trans_doc['payment_session_id'] = order_response['payment_session_id']
        
        # Debug: Log before insert
        logging.info(f"Inserting transaction: {trans_doc.get('session_id')}")
        
        insert_result = await db.payment_transactions.insert_one(trans_doc)
        
        # Debug: Confirm insert
        logging.info(f"Transaction inserted with id: {insert_result.inserted_id}")
        
        # Return Cashfree checkout URL (using payment_session_id for JS SDK or redirect)
        cashfree_env = os.environ.get('CASHFREE_ENVIRONMENT', 'SANDBOX')
        checkout_base = "https://payments.cashfree.com/order" if cashfree_env == "PRODUCTION" else "https://payments-test.cashfree.com/order"
        checkout_url = f"{checkout_base}/#/{order_response['payment_session_id']}"
        
        return {
            "checkout_url": checkout_url,
            "session_id": order_response['order_id'],
            "payment_session_id": order_response['payment_session_id'],
            "order_id": order_response['order_id'],
            "cf_order_id": order_response.get('cf_order_id')
        }
        
    except Exception as e:
        logging.error(f"Cashfree checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")

@api_router.get("/wallet")
async def get_customer_wallet(current_user: dict = Depends(get_current_user)):
    """Get customer wallet with available visits and packages."""
    customer_id = current_user['id']
    
    # Get active visit packages
    now = datetime.now(timezone.utc).isoformat()
    packages = await db.visit_packages.find({
        "customer_id": customer_id,
        "valid_until": {"$gt": now}
    }, {"_id": 0}).to_list(20)
    
    # Calculate total available visits
    visits_available = sum(
        max(0, p.get('total_visits', 0) - p.get('visits_used', 0)) 
        for p in packages
    )
    
    # Get property locks
    locks = await db.property_locks.find({
        "customer_id": customer_id,
        "valid_until": {"$gt": now}
    }, {"_id": 0}).to_list(20)
    
    # Get recent transactions
    transactions = await db.payment_transactions.find({
        "user_id": customer_id
    }, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "balance": 0,  # Placeholder for future wallet balance feature
        "visits_available": visits_available,
        "active_packages": packages,
        "property_locks": locks,
        "recent_transactions": transactions
    }

@api_router.get("/payments/status/{order_id}")
async def get_payment_status(order_id: str, current_user: dict = Depends(get_current_user)):
    """Check payment status and process successful payments."""
    transaction = await db.payment_transactions.find_one({"session_id": order_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction['payment_status'] == "paid":
        return transaction
    
    try:
        cashfree_service = get_cashfree_service()
        order_status = await cashfree_service.get_order_status(order_id)
        
        cf_status = order_status.get('order_status', '').upper()
        logging.info(f"Cashfree order {order_id} status check: {cf_status}")
        
        # Also check payment details for this order
        payments = await cashfree_service.get_payments_for_order(order_id)
        payment_successful = any(
            p.get('payment_status', '').upper() == 'SUCCESS' 
            for p in payments
        )
        
        logging.info(f"Cashfree order {order_id} payments: {payments}, payment_successful: {payment_successful}")
        
        # Handle PAID/SUCCESS status - Cashfree may return either
        # Also check if any payment was successful
        if (cf_status in ["PAID", "SUCCESS"] or payment_successful) and transaction['payment_status'] != "paid":
            logging.info(f"Processing successful payment for {order_id}")
            
            await db.payment_transactions.update_one(
                {"session_id": order_id},
                {"$set": {"payment_status": "paid", "payment_id": order_status.get('cf_order_id')}}
            )
            
            package = PAYMENT_PACKAGES.get(transaction['package_type'], {})
            package_type = package.get('type', 'visit')
            
            # Handle visit packages
            if 'visits' in package:
                # Check if package already exists (avoid duplicates)
                existing_pkg = await db.visit_packages.find_one({
                    "customer_id": transaction['user_id'],
                    "package_type": transaction['package_type'],
                    "amount_paid": transaction['amount'],
                    "created_at": {"$gt": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()}
                })
                
                if not existing_pkg:
                    visit_package = VisitPackage(
                        customer_id=transaction['user_id'],
                        package_type=transaction['package_type'],
                        total_visits=package['visits'],
                        visits_used=0,
                        amount_paid=transaction['amount'],
                        valid_until=datetime.now(timezone.utc) + timedelta(days=package['validity_days'])
                    )
                    pkg_doc = visit_package.model_dump()
                    pkg_doc['created_at'] = pkg_doc['created_at'].isoformat()
                    pkg_doc['valid_until'] = pkg_doc['valid_until'].isoformat()
                    await db.visit_packages.insert_one(pkg_doc)
                    logging.info(f"Created visit package for {transaction['user_id']}")
            
            # Handle property lock
            if transaction['package_type'] == "property_lock" and transaction.get('metadata', {}).get('property_id'):
                lock = PropertyLock(
                    customer_id=transaction['user_id'],
                    property_id=transaction['metadata']['property_id']
                )
                lock_doc = lock.model_dump()
                lock_doc['created_at'] = lock_doc['created_at'].isoformat()
                await db.property_locks.insert_one(lock_doc)
            
            # Handle packers booking confirmation
            if package_type == "packers" and transaction.get('metadata', {}).get('booking_id'):
                booking_id = transaction['metadata']['booking_id']
                await db.shifting_bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "status": "confirmed",
                        "payment_status": "paid",
                        "payment_session_id": order_id,
                        "final_price": transaction['amount']
                    }}
                )
            
            # Handle advertising payment
            if package_type == "advertising" and transaction.get('metadata', {}).get('ad_id'):
                ad_id = transaction['metadata']['ad_id']
                await db.advertisements.update_one(
                    {"id": ad_id},
                    {"$set": {
                        "status": "active",
                        "payment_status": "paid",
                        "payment_session_id": order_id,
                        "amount_paid": transaction['amount']
                    }}
                )
            
            transaction['payment_status'] = "paid"
        elif cf_status in ["EXPIRED", "CANCELLED", "FAILED", "TERMINATED", "VOID"]:
            await db.payment_transactions.update_one(
                {"session_id": order_id},
                {"$set": {"payment_status": "failed"}}
            )
            transaction['payment_status'] = "failed"
        
        return transaction
        
    except Exception as e:
        logging.error(f"Payment status check error: {str(e)}")
        return transaction

@api_router.post("/webhook/cashfree")
async def cashfree_webhook(request: Request):
    """Handle Cashfree payment webhooks."""
    try:
        raw_body = await request.body()
        signature = request.headers.get('x-webhook-signature', '')
        timestamp = request.headers.get('x-webhook-timestamp', '')
        
        # Parse webhook data
        webhook_data = json.loads(raw_body.decode('utf-8'))
        
        # Log raw webhook for debugging
        logging.info(f"Cashfree webhook raw: {webhook_data}")
        
        # Extract payment data - handle multiple payload formats
        data = webhook_data.get('data', {})
        order_data = data.get('order', {})
        payment_data = data.get('payment', {})
        
        # Try different payload structures for order_id
        order_id = (
            order_data.get('order_id') or 
            data.get('order_id') or 
            webhook_data.get('order_id') or
            payment_data.get('order_id')
        )
        
        # Try different payload structures for payment_status
        payment_status = (
            payment_data.get('payment_status') or 
            data.get('payment_status') or 
            webhook_data.get('payment_status') or
            data.get('txStatus')
        )
        
        event_type = webhook_data.get('type', '')
        
        logging.info(f"Cashfree webhook parsed: order={order_id}, status={payment_status}, type={event_type}")
        
        # Handle both old and new webhook formats
        is_success = (
            (event_type == 'PAYMENT_SUCCESS_WEBHOOK' and payment_status == 'SUCCESS') or
            (payment_status in ['SUCCESS', 'PAID']) or
            (event_type in ['PAYMENT_SUCCESS', 'PAYMENT_CAPTURED'])
        )
        
        if is_success and order_id:
            # Find transaction
            transaction = await db.payment_transactions.find_one({"session_id": order_id})
            
            if transaction and transaction.get('payment_status') != 'paid':
                # Update transaction status
                await db.payment_transactions.update_one(
                    {"session_id": order_id},
                    {"$set": {"payment_status": "paid", "payment_id": payment_data.get('cf_payment_id')}}
                )
                
                package = PAYMENT_PACKAGES.get(transaction['package_type'], {})
                package_type = package.get('type', 'visit')
                
                # Handle visit packages
                if 'visits' in package:
                    visit_package = VisitPackage(
                        customer_id=transaction['user_id'],
                        package_type=transaction['package_type'],
                        total_visits=package['visits'],
                        visits_used=0,
                        amount_paid=transaction['amount'],
                        valid_until=datetime.now(timezone.utc) + timedelta(days=package['validity_days'])
                    )
                    pkg_doc = visit_package.model_dump()
                    pkg_doc['created_at'] = pkg_doc['created_at'].isoformat()
                    pkg_doc['valid_until'] = pkg_doc['valid_until'].isoformat()
                    await db.visit_packages.insert_one(pkg_doc)
                
                # Handle property lock
                if transaction['package_type'] == "property_lock" and transaction.get('metadata', {}).get('property_id'):
                    lock = PropertyLock(
                        customer_id=transaction['user_id'],
                        property_id=transaction['metadata']['property_id']
                    )
                    lock_doc = lock.model_dump()
                    lock_doc['created_at'] = lock_doc['created_at'].isoformat()
                    await db.property_locks.insert_one(lock_doc)
                
                # Handle packers booking confirmation
                if package_type == "packers" and transaction.get('metadata', {}).get('booking_id'):
                    booking_id = transaction['metadata']['booking_id']
                    await db.shifting_bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "status": "confirmed",
                            "payment_status": "paid",
                            "payment_session_id": order_id,
                            "final_price": transaction['amount']
                        }}
                    )
                
                # Handle advertising payment
                if package_type == "advertising" and transaction.get('metadata', {}).get('ad_id'):
                    ad_id = transaction['metadata']['ad_id']
                    await db.advertisements.update_one(
                        {"id": ad_id},
                        {"$set": {
                            "status": "active",
                            "payment_status": "paid",
                            "payment_session_id": order_id,
                            "amount_paid": transaction['amount']
                        }}
                    )
                
                logging.info(f"Payment processed successfully for order: {order_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Cashfree webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Visit booking endpoints
@api_router.post("/visits/book")
async def book_visit(booking_data: VisitBookingCreate, current_user: dict = Depends(get_current_user)):
    # Check if user has available visits using aggregation
    # Support both customer_id and user_id for backward compatibility
    num_properties = len(booking_data.property_ids)
    
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"customer_id": current_user['id']},
                    {"user_id": current_user['id']}
                ],
                "valid_until": {"$gt": datetime.now(timezone.utc).isoformat()}
            }
        },
        {
            "$match": {
                "$expr": {"$lt": ["$visits_used", "$total_visits"]}
            }
        },
        {"$limit": 10}
    ]
    packages = await db.visit_packages.aggregate(pipeline).to_list(None)
    
    if not packages:
        raise HTTPException(status_code=400, detail="No available visit credits. Please purchase a visit package first.")
    
    # Calculate total available visits
    total_available = sum(p['total_visits'] - p['visits_used'] for p in packages)
    
    if total_available < num_properties:
        raise HTTPException(status_code=400, detail=f"Not enough visit credits. You have {total_available} visits but need {num_properties}.")
    
    # Generate OTP
    otp = str(uuid.uuid4().int)[:6]
    
    # Calculate estimated duration (15 min per property + 20 min travel between)
    estimated_minutes = num_properties * 15 + (num_properties - 1) * 20 + 30  # +30 for pickup
    hours = estimated_minutes // 60
    mins = estimated_minutes % 60
    estimated_duration = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
    
    # Check for seller referral (either from user's referred_by or from booking data)
    referred_by = current_user.get('referred_by')
    if booking_data.referral_code and not referred_by:
        # Look up seller by referral code
        seller = await db.users.find_one({
            "referral_code": booking_data.referral_code,
            "role": "seller",
            "approval_status": "approved"
        })
        if seller:
            referred_by = seller['id']
    
    booking = VisitBooking(
        customer_id=current_user['id'],
        property_ids=booking_data.property_ids,
        package_id=packages[0]['id'],
        scheduled_date=booking_data.scheduled_date,
        scheduled_time=booking_data.scheduled_time,
        status="pending",
        current_step="waiting",
        current_property_index=0,
        otp=otp,
        total_properties=num_properties,
        estimated_duration=estimated_duration,
        pickup_location=booking_data.pickup_location,
        pickup_lat=booking_data.pickup_lat,
        pickup_lng=booking_data.pickup_lng,
        total_earnings=num_properties * 100,  # ₹100 per property for rider
        referred_by=referred_by  # Track seller who referred this client
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.visit_bookings.insert_one(doc)
    
    # Update seller referral status if applicable
    if referred_by:
        # Update referral record to 'booked'
        await db.seller_referrals.update_one(
            {
                "seller_id": referred_by,
                "client_id": current_user['id'],
                "status": {"$in": ["shared", "registered"]}
            },
            {"$set": {
                "status": "booked",
                "visit_id": doc['id']
            }}
        )
    
    # Increment package usage for each property
    visits_to_deduct = num_properties
    for package in packages:
        available_in_package = package['total_visits'] - package['visits_used']
        deduct_from_this = min(visits_to_deduct, available_in_package)
        await db.visit_packages.update_one(
            {"id": package['id']},
            {"$inc": {"visits_used": deduct_from_this}}
        )
        visits_to_deduct -= deduct_from_this
        if visits_to_deduct <= 0:
            break
    
    doc.pop('_id', None)
    return doc

@api_router.get("/visits/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    # Search by customer_id, user_id, OR customer_phone to support all booking types
    # - customer_id: Standard bookings
    # - user_id: Legacy bookings
    # - customer_phone: Admin manual bookings where customer account was created later
    try:
        bookings = await db.visit_bookings.find(
            {"$or": [
                {"customer_id": current_user['id']}, 
                {"user_id": current_user['id']},
                {"customer_phone": current_user.get('phone')}
            ]}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        # Enrich bookings with rider information
        enriched_bookings = []
        for booking in bookings:
            booking_copy = dict(booking)
            
            # Get rider details if rider is assigned
            rider_id = booking.get('rider_id') or booking.get('assigned_rider_id')
            if rider_id:
                rider = await db.users.find_one(
                    {"id": rider_id}, 
                    {"_id": 0, "password": 0}
                )
                if rider:
                    booking_copy['rider_name'] = rider.get('name', 'Assigned Rider')
                    booking_copy['rider_phone'] = rider.get('phone')
                    booking_copy['rider_photo'] = rider.get('photo')
                    # Include rider's current location for tracking
                    booking_copy['rider_lat'] = rider.get('current_lat')
                    booking_copy['rider_lng'] = rider.get('current_lng')
                    booking_copy['rider_is_online'] = rider.get('is_online', False)
            
            # Get first property info for display
            prop_ids = booking.get('property_ids', [])
            if not prop_ids and booking.get('property_id'):
                prop_ids = [booking.get('property_id')]
            if prop_ids:
                first_prop = await db.properties.find_one({"id": prop_ids[0]}, {"_id": 0})
                if first_prop:
                    booking_copy['property_title'] = first_prop.get('title')
                    booking_copy['property_area'] = first_prop.get('area_name')
                    booking_copy['property_city'] = first_prop.get('city')
            
            enriched_bookings.append(booking_copy)
        
        # Sanitize all documents to handle any ObjectId references
        return sanitize_mongo_doc(enriched_bookings)
    except Exception as e:
        import traceback
        print(f"ERROR in get_my_bookings: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@api_router.get("/visits/{visit_id}/track")
async def track_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    """Get real-time tracking info for a visit (like Uber tracking)"""
    # Get the visit
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Verify customer owns this visit
    customer_id = visit.get('customer_id') or visit.get('user_id')
    customer_phone = visit.get('customer_phone')
    if customer_id != current_user['id'] and customer_phone != current_user.get('phone'):
        raise HTTPException(status_code=403, detail="Not your visit")
    
    # Get rider info if assigned
    rider_id = visit.get('rider_id') or visit.get('assigned_rider_id')
    rider_info = None
    eta_minutes = None
    distance_km = None
    
    if rider_id:
        rider = await db.users.find_one({"id": rider_id}, {"_id": 0, "password": 0})
        if rider:
            rider_info = {
                "id": rider.get('id'),
                "name": rider.get('name', 'Assigned Rider'),
                "phone": rider.get('phone'),
                "photo": rider.get('photo'),
                "is_online": rider.get('is_online', False),
                "current_lat": rider.get('current_lat'),
                "current_lng": rider.get('current_lng'),
                "last_location_update": rider.get('last_location_update')
            }
            
            # Calculate ETA if rider has location and visit has pickup location
            rider_lat = rider.get('current_lat')
            rider_lng = rider.get('current_lng')
            pickup_lat = visit.get('pickup_lat')
            pickup_lng = visit.get('pickup_lng')
            
            if rider_lat and rider_lng and pickup_lat and pickup_lng:
                from services.tracking_service import haversine_distance
                distance_km = haversine_distance(rider_lat, rider_lng, pickup_lat, pickup_lng)
                # Assume average speed of 25 km/h in city
                eta_minutes = round((distance_km / 25) * 60)
    
    # Get property info
    properties = []
    prop_ids = visit.get('property_ids', [])
    if not prop_ids and visit.get('property_id'):
        prop_ids = [visit.get('property_id')]
    for prop_id in prop_ids:
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if prop:
            properties.append({
                "id": prop.get('id'),
                "title": prop.get('title'),
                "area_name": prop.get('area_name'),
                "city": prop.get('city'),
                "latitude": prop.get('latitude'),
                "longitude": prop.get('longitude')
            })
    
    return {
        "visit": {
            "id": visit.get('id'),
            "status": visit.get('status'),
            "current_step": visit.get('current_step'),
            "pickup_location": visit.get('pickup_location'),
            "pickup_lat": visit.get('pickup_lat'),
            "pickup_lng": visit.get('pickup_lng'),
            "scheduled_date": visit.get('scheduled_date') or visit.get('preferred_date'),
            "scheduled_time": visit.get('scheduled_time') or visit.get('preferred_time'),
            "otp": visit.get('otp')
        },
        "rider": rider_info,
        "eta_minutes": eta_minutes,
        "distance_km": round(distance_km, 2) if distance_km else None,
        "properties": properties
    }

@api_router.get("/visits/available")
async def get_available_visits(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Only show pending visits to online riders
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if not rider.get('is_online', False):
        return []  # Offline riders don't see visits
    
    # Get rider's current location (check both fields)
    rider_lat = rider.get('current_lat') or rider.get('latitude')
    rider_lng = rider.get('current_lng') or rider.get('longitude')
    
    # Find pending/confirmed/assigned visits that are either:
    # 1. Unassigned (no rider) - available for any rider to accept
    # 2. Assigned to THIS specific rider - show in their active visits
    
    # Combine queries - handle both None and empty string '' for assigned_rider_id
    # Production data has assigned_rider_id: '' while new code uses None
    visits = await db.visit_bookings.find(
        {"$or": [
            # Unassigned pending/confirmed visits (rider_id None, assigned_rider_id None or empty)
            {"status": "pending", "rider_id": None, "assigned_rider_id": None},
            {"status": "pending", "rider_id": None, "assigned_rider_id": ""},
            {"status": "confirmed", "rider_id": None, "assigned_rider_id": None},
            {"status": "confirmed", "rider_id": None, "assigned_rider_id": ""},
            # Assigned to this rider
            {"rider_id": current_user['id']},
            {"assigned_rider_id": current_user['id']}
        ]}, 
        {"_id": 0}
    ).limit(50).to_list(None)
    
    # Filter to only show pending/confirmed/assigned status
    visits = [v for v in visits if v.get('status') in ['pending', 'confirmed', 'assigned']]
    
    # Debug: Log query results
    print(f"DEBUG: Rider {current_user['id']} query returned {len(visits)} visits")
    
    # Batch fetch all property IDs to avoid N+1 queries
    all_prop_ids = []
    for visit in visits:
        all_prop_ids.extend(visit.get('property_ids', []))
        if visit.get('property_id'):
            all_prop_ids.append(visit.get('property_id'))
    
    # Single query to get all properties WITH coordinates
    if all_prop_ids:
        properties_list = await db.properties.find(
            {"id": {"$in": all_prop_ids}}, 
            {"_id": 0}  # Include lat/lng for distance calculation
        ).to_list(None)
        prop_map = {p['id']: p for p in properties_list}
    else:
        prop_map = {}
    
    # Filter visits by 50 km radius if rider has location
    filtered_visits = []
    for visit in visits:
        # Get property location
        prop_ids = visit.get('property_ids', [])
        if not prop_ids and visit.get('property_id'):
            prop_ids = [visit.get('property_id')]
        
        # Get the first property's coordinates for distance check
        property_lat = None
        property_lng = None
        for pid in prop_ids:
            prop = prop_map.get(pid)
            if prop:
                property_lat = prop.get('latitude')
                property_lng = prop.get('longitude')
                if property_lat and property_lng:
                    break
        
        # Calculate distance if both locations are available
        if rider_lat and rider_lng and property_lat and property_lng:
            distance = calculate_distance_km(rider_lat, rider_lng, property_lat, property_lng)
            visit['distance_km'] = round(distance, 1)
            
            # Only include visits within 50 km radius
            if distance <= RIDER_MAX_RADIUS_KM:
                visit['properties'] = [prop_map.get(pid) for pid in prop_ids if prop_map.get(pid)]
                # Remove sensitive location data from response
                for prop in visit.get('properties', []):
                    if prop:
                        prop.pop('latitude', None)
                        prop.pop('longitude', None)
                        prop.pop('exact_address', None)
                filtered_visits.append(visit)
        else:
            # If location not available, show all visits (backward compatibility)
            # But mark them as unknown distance
            visit['distance_km'] = None
            visit['properties'] = [prop_map.get(pid) for pid in prop_ids if prop_map.get(pid)]
            for prop in visit.get('properties', []):
                if prop:
                    prop.pop('latitude', None)
                    prop.pop('longitude', None)
                    prop.pop('exact_address', None)
            filtered_visits.append(visit)
    
    # Sort by distance (closest first), unknown distances at the end
    filtered_visits.sort(key=lambda x: x.get('distance_km') if x.get('distance_km') is not None else 9999)
    
    # Also check for any assigned/active visit for this rider (check both rider_id and assigned_rider_id)
    active_visit = await db.visit_bookings.find_one({
        "$or": [
            {"rider_id": current_user['id']},
            {"assigned_rider_id": current_user['id']}
        ],
        "status": {"$in": ["assigned", "rider_assigned", "pickup_started", "at_customer", "navigating", "at_property", "in_progress"]}
    }, {"_id": 0})
    
    # If there's an active visit, enrich it with customer and property details
    active_response = None
    if active_visit:
        # Get customer - check both customer_id and user_id for compatibility
        customer_id = active_visit.get('customer_id') or active_visit.get('user_id')
        customer = None
        if customer_id:
            customer = await db.users.find_one({"id": customer_id}, {"_id": 0, "password": 0})
        
        # If customer not found by ID, try by phone
        if not customer and active_visit.get('customer_phone'):
            customer = await db.users.find_one({"phone": active_visit.get('customer_phone')}, {"_id": 0, "password": 0})
        
        # Get properties - check both property_ids and property_id
        prop_ids = active_visit.get('property_ids', [])
        if not prop_ids and active_visit.get('property_id'):
            prop_ids = [active_visit.get('property_id')]
            
        properties = []
        for prop_id in prop_ids:
            prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
            if prop:
                properties.append(prop)
        
        # Enrich visit with fallback pickup location if missing
        enriched_visit = dict(active_visit)
        if not enriched_visit.get('pickup_location') and not enriched_visit.get('pickup_lat'):
            # Fallback 1: Customer's address
            if customer and customer.get('address'):
                enriched_visit['pickup_location'] = customer.get('address')
                enriched_visit['pickup_lat'] = customer.get('address_lat')
                enriched_visit['pickup_lng'] = customer.get('address_lng')
            # Fallback 2: First property location
            elif properties:
                first_prop = properties[0]
                enriched_visit['pickup_location'] = first_prop.get('exact_address') or \
                    f"{first_prop.get('area_name', '')}, {first_prop.get('city', '')}"
                enriched_visit['pickup_lat'] = first_prop.get('latitude')
                enriched_visit['pickup_lng'] = first_prop.get('longitude')
        
        active_response = {
            "visit": enriched_visit,
            "customer": customer,
            "properties": properties,
            "optimized_route": active_visit.get('optimized_route')
        }
    
    return {
        "available": filtered_visits[:20],
        "active": active_response
    }

@api_router.post("/visits/{visit_id}/accept")
async def accept_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Check if rider is online
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if not rider.get('is_online', False):
        raise HTTPException(status_code=400, detail="You must be online to accept visits")
    
    # Get rider's location (check both fields for compatibility)
    rider_lat = rider.get('current_lat') or rider.get('latitude')
    rider_lng = rider.get('current_lng') or rider.get('longitude')
    
    # Get the visit to check distance - accept both pending and confirmed status
    # Using $or for status matching due to MongoDB query behavior
    visit = await db.visit_bookings.find_one({
        "id": visit_id, 
        "$or": [{"status": "pending"}, {"status": "confirmed"}],
        "rider_id": None  # Simple equality for null check
    }, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=400, detail="Visit not available or already assigned")
    
    # Get property coordinates to verify distance
    prop_ids = visit.get('property_ids', [])
    if not prop_ids and visit.get('property_id'):
        prop_ids = [visit.get('property_id')]
    
    if prop_ids and rider_lat and rider_lng:
        # Get first property's coordinates
        prop = await db.properties.find_one({"id": prop_ids[0]}, {"_id": 0, "latitude": 1, "longitude": 1})
        if prop:
            property_lat = prop.get('latitude')
            property_lng = prop.get('longitude')
            
            if property_lat and property_lng:
                distance = calculate_distance_km(rider_lat, rider_lng, property_lat, property_lng)
                if distance > RIDER_MAX_RADIUS_KM:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"This property is {distance:.1f} km away. You can only accept visits within {RIDER_MAX_RADIUS_KM} km radius."
                    )
    
    result = await db.visit_bookings.update_one(
        {
            "id": visit_id, 
            "$or": [{"status": "pending"}, {"status": "confirmed"}],
            "rider_id": None  # Simple equality for null check
        },
        {"$set": {
            "rider_id": current_user['id'], 
            "assigned_rider_id": current_user['id'],  # Set both for consistency
            "status": "rider_assigned",
            "current_step": "go_to_customer"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Visit not available")
    
    # Return visit with ALL property details including exact location
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    
    # Get customer details - check both customer_id and user_id for compatibility
    customer_id = visit.get('customer_id') or visit.get('user_id')
    customer = None
    if customer_id:
        customer = await db.users.find_one({"id": customer_id}, {"_id": 0, "password": 0})
    
    # Get all properties with FULL details including exact address
    properties = []
    prop_ids = visit.get('property_ids', [])
    # Also check for single property_id field
    if not prop_ids and visit.get('property_id'):
        prop_ids = [visit.get('property_id')]
    for prop_id in prop_ids:
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if prop:
            properties.append(prop)
    
    # Optimize route if multiple properties and rider has location
    optimized_route = None
    if len(properties) > 1 and rider_lat and rider_lng:
        from services.tracking_service import optimize_visit_route, haversine_distance
        
        visits_for_optimization = [
            {
                "id": p['id'],
                "lat": p.get('latitude', 0),
                "lng": p.get('longitude', 0),
                "title": p.get('title', ''),
                "address": p.get('address', '')
            }
            for p in properties if p.get('latitude') and p.get('longitude')
        ]
        
        if visits_for_optimization:
            optimized = optimize_visit_route(visits_for_optimization, (rider_lat, rider_lng))
            
            # Calculate total distance
            total_distance = 0
            current_loc = (rider_lat, rider_lng)
            for v in optimized:
                total_distance += haversine_distance(current_loc[0], current_loc[1], v['lat'], v['lng'])
                current_loc = (v['lat'], v['lng'])
            
            optimized_route = {
                "visits": optimized,
                "total_distance_km": round(total_distance, 2),
                "estimated_time_minutes": round((total_distance / 25) * 60 + len(optimized) * 15, 0)
            }
            
            # Save optimized order to the visit
            await db.visit_bookings.update_one(
                {"id": visit_id},
                {"$set": {"optimized_route": optimized_route}}
            )
    
    # Enrich visit with fallback pickup location if missing
    enriched_visit = dict(visit)
    if not enriched_visit.get('pickup_location') and not enriched_visit.get('pickup_lat'):
        # Fallback 1: Customer's address
        if customer and customer.get('address'):
            enriched_visit['pickup_location'] = customer.get('address')
            enriched_visit['pickup_lat'] = customer.get('address_lat')
            enriched_visit['pickup_lng'] = customer.get('address_lng')
        # Fallback 2: First property location
        elif properties:
            first_prop = properties[0]
            enriched_visit['pickup_location'] = first_prop.get('exact_address') or \
                f"{first_prop.get('area_name', '')}, {first_prop.get('city', '')}"
            enriched_visit['pickup_lat'] = first_prop.get('latitude')
            enriched_visit['pickup_lng'] = first_prop.get('longitude')
    
    return {
        "visit": enriched_visit, 
        "properties": properties,
        "customer": customer,
        "optimized_route": optimized_route
    }

@api_router.post("/visits/{visit_id}/update-step")
async def update_visit_step(visit_id: str, step_data: VisitStepUpdate, current_user: dict = Depends(get_current_user)):
    """Update visit progress step by step (Uber Eats style navigation)"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Check both rider_id and assigned_rider_id for compatibility
    visit = await db.visit_bookings.find_one({
        "id": visit_id, 
        "$or": [
            {"rider_id": current_user['id']},
            {"assigned_rider_id": current_user['id']}
        ]
    }, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found or not assigned to you")
    
    update_data = {}
    action = step_data.action
    notify_admins = False
    notification_title = ""
    notification_message = ""
    
    if action == "start_pickup":
        update_data["current_step"] = "go_to_customer"
        update_data["status"] = "pickup_started"
        update_data["visit_start_time"] = datetime.now(timezone.utc).isoformat()
        notify_admins = True
        notification_title = "Ride Started"
        notification_message = f"Rider {current_user['name']} started visit - heading to customer"
    
    elif action == "arrived_customer":
        update_data["current_step"] = "at_customer"
        update_data["status"] = "at_customer"
    
    elif action == "start_property":
        # Move to first/next property
        idx = visit.get('current_property_index', 0)
        update_data["current_step"] = f"go_to_property_{idx}"
        update_data["status"] = "navigating"
    
    elif action == "arrived_property":
        idx = visit.get('current_property_index', 0)
        update_data["current_step"] = f"at_property_{idx}"
        update_data["status"] = "at_property"
    
    elif action == "complete_property":
        # Mark current property as completed and move to next
        idx = visit.get('current_property_index', 0)
        property_ids = visit.get('property_ids', [])
        completed = visit.get('properties_completed', [])
        
        if idx < len(property_ids):
            completed.append(property_ids[idx])
        
        update_data["properties_completed"] = completed
        
        # Check if there are more properties
        if idx + 1 < len(property_ids):
            update_data["current_property_index"] = idx + 1
            update_data["current_step"] = f"go_to_property_{idx + 1}"
            update_data["status"] = "navigating"
            
            # Increment visit count for completed property
            completed_prop_id = property_ids[idx]
            await db.properties.update_one(
                {"id": completed_prop_id},
                {
                    "$inc": {"visit_count": 1, "weekly_visits": 1},
                    "$set": {"last_visited": datetime.now(timezone.utc).isoformat()}
                }
            )
        else:
            # All properties done
            update_data["current_step"] = "completed"
            update_data["status"] = "completed"
            update_data["visit_end_time"] = datetime.now(timezone.utc).isoformat()
            notify_admins = True
            notification_title = "Ride Completed"
            notification_message = f"Rider {current_user['name']} completed visit - {len(property_ids)} properties"
            
            # Increment visit count for last property
            if property_ids:
                last_prop_id = property_ids[-1]
                await db.properties.update_one(
                    {"id": last_prop_id},
                    {
                        "$inc": {"visit_count": 1, "weekly_visits": 1},
                        "$set": {"last_visited": datetime.now(timezone.utc).isoformat()}
                    }
                )
            
            # Create pending transaction for rider earnings
            earnings = visit.get('total_earnings', 0)
            transaction = RiderTransaction(
                rider_id=current_user['id'],
                type="visit_earning",
                amount=earnings,
                status="pending",
                reference_id=visit_id,
                reference_type="visit",
                description=f"Visit completed: {len(property_ids)} properties"
            )
            trans_doc = transaction.model_dump()
            trans_doc['created_at'] = trans_doc['created_at'].isoformat()
            await db.rider_transactions.insert_one(trans_doc)
            
            # Update wallet
            await db.rider_wallets.update_one(
                {"rider_id": current_user['id']},
                {
                    "$inc": {"pending_earnings": earnings, "total_earnings": earnings},
                    "$setOnInsert": {"approved_earnings": 0, "paid_earnings": 0}
                },
                upsert=True
            )
    
    elif action == "complete_visit":
        update_data["current_step"] = "completed"
        update_data["status"] = "completed"
        update_data["visit_end_time"] = datetime.now(timezone.utc).isoformat()
        notify_admins = True
        notification_title = "Ride Completed"
        notification_message = f"Rider {current_user['name']} completed visit"
    
    await db.visit_bookings.update_one({"id": visit_id}, {"$set": update_data})
    
    # Send notifications to admins
    if notify_admins:
        admins = await db.users.find({"role": {"$in": ["admin", "rider_admin", "support_admin"]}}, {"_id": 0}).to_list(50)
        for admin in admins:
            notification = Notification(
                user_id=admin['id'],
                type="ride_update",
                title=notification_title,
                message=notification_message,
                reference_id=visit_id,
                reference_type="visit"
            )
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
    
    updated_visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    return updated_visit

@api_router.get("/visits/{visit_id}/details")
async def get_visit_details(visit_id: str, current_user: dict = Depends(get_current_user)):
    """Get full visit details including all properties for rider navigation"""
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Check authorization
    if current_user['role'] == 'rider' and visit.get('rider_id') != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user['role'] == 'customer' and visit.get('customer_id') != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get customer details
    customer = await db.users.find_one({"id": visit['customer_id']}, {"_id": 0, "password": 0})
    
    # Get rider details if assigned
    rider = None
    if visit.get('rider_id'):
        rider = await db.users.find_one({"id": visit['rider_id']}, {"_id": 0, "password": 0})
    
    # Get all properties with FULL details (for rider)
    properties = []
    for prop_id in visit.get('property_ids', []):
        if current_user['role'] == 'rider' or current_user['role'] in ['admin', 'support_admin']:
            prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        else:
            # Customer doesn't see exact address until visit
            prop = await db.properties.find_one({"id": prop_id}, {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0})
        if prop:
            properties.append(prop)
    
    return {
        "visit": visit,
        "properties": properties,
        "customer": customer,
        "rider": rider
    }

# Rider shift endpoints
@api_router.post("/rider/shift")
async def update_rider_shift(shift_data: RiderShiftUpdate, current_user: dict = Depends(get_current_user)):
    """Toggle rider online/offline status"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    update_data = {
        "is_online": shift_data.is_online,
        "last_location_update": datetime.now(timezone.utc).isoformat()
    }
    
    if shift_data.current_lat is not None:
        update_data["current_lat"] = shift_data.current_lat
    if shift_data.current_lng is not None:
        update_data["current_lng"] = shift_data.current_lng
    
    await db.users.update_one({"id": current_user['id']}, {"$set": update_data})
    
    return {"success": True, "is_online": shift_data.is_online}

@api_router.get("/rider/shift")
async def get_rider_shift(current_user: dict = Depends(get_current_user)):
    """Get rider's current shift status"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    return {
        "is_online": rider.get('is_online', False),
        "current_lat": rider.get('current_lat'),
        "current_lng": rider.get('current_lng')
    }

@api_router.post("/rider/location")
async def update_rider_location(lat: float, lng: float, current_user: dict = Depends(get_current_user)):
    """Update rider's current location"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "current_lat": lat,
            "current_lng": lng,
            "last_location_update": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True}


# ============ COMPLIANCE CHECK ENDPOINTS ============

class ComplianceCheckData(BaseModel):
    property_id: Optional[str] = None
    answers: dict

class ViolationReportData(BaseModel):
    violation_type: str  # contact_shared, negotiation_help
    rider_report: bool = True
    details: dict

class TerminateVisitData(BaseModel):
    reason: str
    violation_details: dict

@api_router.post("/visits/{visit_id}/compliance-check")
async def save_compliance_check(visit_id: str, data: ComplianceCheckData, current_user: dict = Depends(get_current_user)):
    """Save compliance check after each property visit"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    visit = await db.visit_bookings.find_one({"id": visit_id, "rider_id": current_user['id']}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    compliance_record = {
        "id": str(uuid.uuid4()),
        "visit_id": visit_id,
        "rider_id": current_user['id'],
        "property_id": data.property_id,
        "answers": data.answers,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert into compliance_checks collection
    await db.compliance_checks.insert_one(compliance_record.copy())  # Use copy to prevent _id mutation
    
    # Also append to visit record (use original record without _id)
    await db.visit_bookings.update_one(
        {"id": visit_id},
        {"$push": {"compliance_checks": compliance_record}}
    )
    
    return {"status": "saved", "id": compliance_record["id"]}

@api_router.post("/visits/{visit_id}/report-violation")
async def report_violation(visit_id: str, data: ViolationReportData, current_user: dict = Depends(get_current_user)):
    """Report a terms violation during visit"""
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Get customer info
    customer = await db.users.find_one({"id": visit.get('customer_id')}, {"_id": 0, "password": 0})
    
    violation = {
        "id": str(uuid.uuid4()),
        "visit_id": visit_id,
        "customer_id": visit.get('customer_id'),
        "customer_name": customer.get('name') if customer else None,
        "customer_phone": customer.get('phone') if customer else None,
        "rider_id": visit.get('rider_id'),
        "reporter_id": current_user['id'],
        "reporter_role": current_user['role'],
        "violation_type": data.violation_type,
        "details": data.details,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.violations.insert_one(violation)
    
    # Mark customer for potential ban
    await db.users.update_one(
        {"id": visit.get('customer_id')},
        {
            "$inc": {"violation_count": 1},
            "$push": {"violation_ids": violation["id"]}
        }
    )
    
    # Notify admins
    admins = await db.users.find({"role": {"$in": ["admin", "support_admin"]}}, {"_id": 0}).to_list(50)
    for admin in admins:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": admin['id'],
            "type": "violation_report",
            "title": "⚠️ Terms Violation Reported",
            "message": f"Violation by customer {customer.get('name') if customer else 'Unknown'}: {data.violation_type}",
            "reference_id": violation["id"],
            "reference_type": "violation",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    return {"status": "reported", "violation_id": violation["id"]}

@api_router.post("/visits/{visit_id}/terminate")
async def terminate_visit(visit_id: str, data: TerminateVisitData, current_user: dict = Depends(get_current_user)):
    """Terminate a visit due to violation"""
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Update visit status
    await db.visit_bookings.update_one(
        {"id": visit_id},
        {"$set": {
            "status": "terminated",
            "termination_reason": data.reason,
            "termination_details": data.violation_details,
            "terminated_at": datetime.now(timezone.utc).isoformat(),
            "terminated_by": current_user['id']
        }}
    )
    
    # If customer violated terms, apply penalties
    if data.reason == "terms_violation":
        # Flag customer account
        await db.users.update_one(
            {"id": visit.get('customer_id')},
            {"$set": {
                "flagged_for_violation": True,
                "last_violation_date": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Create penalty record
        penalty = {
            "id": str(uuid.uuid4()),
            "user_id": visit.get('customer_id'),
            "visit_id": visit_id,
            "penalty_type": "terms_violation",
            "amount": 50000,  # ₹50,000 minimum penalty
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.penalties.insert_one(penalty)
    
    return {"status": "terminated", "reason": data.reason}

@api_router.get("/admin/violations")
async def get_violations(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    """Get all reported violations for admin review"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    violations = await db.violations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {"violations": violations, "count": len(violations)}

@api_router.get("/rider/active-visit")
async def get_active_visit(current_user: dict = Depends(get_current_user)):
    """Get rider's currently active visit with optimized route"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Find any non-completed visit assigned to this rider
    visit = await db.visit_bookings.find_one({
        "rider_id": current_user['id'],
        "status": {"$nin": ["completed", "cancelled", "pending"]}
    }, {"_id": 0})
    
    if not visit:
        return None
    
    # Get full details
    customer = await db.users.find_one({"id": visit['customer_id']}, {"_id": 0, "password": 0})
    
    properties = []
    for prop_id in visit.get('property_ids', []):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if prop:
            properties.append(prop)
    
    # Get rider's current location for route optimization (check both fields)
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    rider_lat = rider.get('current_lat') or rider.get('latitude')
    rider_lng = rider.get('current_lng') or rider.get('longitude')
    
    # Calculate optimized route if not already saved
    optimized_route = visit.get('optimized_route')
    if not optimized_route and len(properties) > 1 and rider_lat and rider_lng:
        from services.tracking_service import optimize_visit_route, haversine_distance
        
        visits_for_optimization = [
            {
                "id": p['id'],
                "lat": p.get('latitude', 0),
                "lng": p.get('longitude', 0),
                "title": p.get('title', ''),
                "address": p.get('address', '')
            }
            for p in properties if p.get('latitude') and p.get('longitude')
        ]
        
        if visits_for_optimization:
            optimized = optimize_visit_route(visits_for_optimization, (rider_lat, rider_lng))
            
            total_distance = 0
            current_loc = (rider_lat, rider_lng)
            for v in optimized:
                total_distance += haversine_distance(current_loc[0], current_loc[1], v['lat'], v['lng'])
                current_loc = (v['lat'], v['lng'])
            
            optimized_route = {
                "visits": optimized,
                "total_distance_km": round(total_distance, 2),
                "estimated_time_minutes": round((total_distance / 25) * 60 + len(optimized) * 15, 0)
            }
            
            # Save for future
            await db.visit_bookings.update_one(
                {"id": visit['id']},
                {"$set": {"optimized_route": optimized_route}}
            )
    
    return {
        "visit": visit,
        "properties": properties,
        "customer": customer,
        "optimized_route": optimized_route
    }

# Admin: Get all riders
@api_router.get("/admin/riders")
async def get_all_riders(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    riders = await db.users.find(
        {"role": "rider"}, 
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Add rider-specific info for each rider
    for rider in riders:
        rider['on_duty'] = rider.get('is_online', False)
        rider['user_id'] = rider.get('id')
        rider['user'] = {
            'name': rider.get('name', 'Rider'),
            'phone': rider.get('phone', ''),
        }
    
    return riders

# Admin: Get online riders
@api_router.get("/admin/riders/online")
async def get_online_riders(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    riders = await db.users.find(
        {"role": "rider", "is_online": True}, 
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return riders


# Chat endpoints
@api_router.post("/chat/send")
async def send_message(message_data: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    chat_msg = ChatMessage(
        sender_id=current_user['id'],
        receiver_id=message_data.receiver_id,
        message=message_data.message,
        visit_id=message_data.visit_id
    )
    
    doc = chat_msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.chat_messages.insert_one(doc)
    
    doc.pop('_id', None)
    return doc

@api_router.get("/chat/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find({
        "$or": [
            {"sender_id": current_user['id'], "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user['id']}
        ]
    }, {"_id": 0}).sort("created_at", 1).limit(100).to_list(None)
    
    # Mark messages as read
    await db.chat_messages.update_many(
        {"sender_id": other_user_id, "receiver_id": current_user['id'], "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.get("/chat/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": current_user['id']},
                    {"receiver_id": current_user['id']}
                ]
            }
        },
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", current_user['id']]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$message"},
                "last_time": {"$first": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [
                                {"$eq": ["$receiver_id", current_user['id']]},
                                {"$eq": ["$read", False]}
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {"$limit": 50}
    ]
    
    conversations = await db.chat_messages.aggregate(pipeline).to_list(None)
    
    # Batch fetch all user details to avoid N+1 queries
    user_ids = [conv['_id'] for conv in conversations]
    if user_ids:
        users_list = await db.users.find(
            {"id": {"$in": user_ids}}, 
            {"_id": 0, "password": 0}
        ).to_list(None)
        user_map = {u['id']: u for u in users_list}
    else:
        user_map = {}
    
    for conv in conversations:
        conv['user'] = user_map.get(conv['_id'])
        conv['other_user_id'] = conv.pop('_id')
    
    return conversations


# File upload endpoints
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# General file upload - supports any image or video
# Now uses MongoDB GridFS for permanent storage
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload any image or video file - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    content_type = file.content_type or ""
    
    if not (content_type.startswith('image/') or content_type.startswith('video/')):
        raise HTTPException(status_code=400, detail="File must be an image or video")
    
    # Use MongoDB GridFS for permanent storage
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename'], "size": result['size'], "type": content_type}

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload image - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename']}

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload video - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename']}

# App Settings (for explainer video, etc.)
@api_router.get("/settings/explainer-video")
async def get_explainer_video():
    """Get the explainer video URL"""
    setting = await db.app_settings.find_one({"key": "explainer_video"}, {"_id": 0})
    if setting:
        return {"video_url": setting.get("value")}
    return {"video_url": None}

@api_router.post("/settings/explainer-video")
async def set_explainer_video(current_user: dict = Depends(get_current_user)):
    """Upload explainer video (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"message": "Use /api/upload/explainer-video to upload the video"}

@api_router.post("/upload/explainer-video")
async def upload_explainer_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload the 'How It Works' explainer video (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"explainer_video.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    video_url = f"/uploads/{file_name}"
    
    # Save to settings
    await db.app_settings.update_one(
        {"key": "explainer_video"},
        {"$set": {"key": "explainer_video", "value": video_url}},
        upsert=True
    )
    
    return {"url": video_url, "message": "Explainer video uploaded successfully"}

# App Customization Settings (seasonal themes, banners, etc.)
class AppCustomizationSettings(BaseModel):
    seasonal_theme: str = "none"
    seasonal_banner_text: str = ""
    seasonal_discount_percent: int = 0
    seasonal_active: bool = False
    homepage_highlight: str = ""
    accent_color: str = "#FF5A5F"
    enable_animations: bool = True
    show_offers_badge: bool = False

@api_router.get("/settings/app-customization")
async def get_app_customization():
    """Get app customization settings"""
    setting = await db.app_settings.find_one({"key": "app_customization"}, {"_id": 0})
    if setting and setting.get("value"):
        return setting.get("value")
    return AppCustomizationSettings().model_dump()

@api_router.post("/settings/app-customization")
async def set_app_customization(settings: AppCustomizationSettings, current_user: dict = Depends(get_current_user)):
    """Update app customization settings (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.app_settings.update_one(
        {"key": "app_customization"},
        {"$set": {"key": "app_customization", "value": settings.model_dump()}},
        upsert=True
    )
    
    return {"message": "App customization settings saved", "settings": settings.model_dump()}

# ============ ADMIN: PROMOTIONS & OFFERS ============

@api_router.get("/admin/promotions")
async def get_promotions(current_user: dict = Depends(get_current_user)):
    """Get all promotions settings (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings_doc = await db.app_settings.find_one({"key": "promotions"}, {"_id": 0})
    offers_doc = await db.app_settings.find_one({"key": "custom_offers"}, {"_id": 0})
    
    return {
        "settings": settings_doc.get("value", {}) if settings_doc else {},
        "custom_offers": offers_doc.get("value", []) if offers_doc else []
    }

@api_router.post("/admin/promotions")
async def save_promotions(data: dict, current_user: dict = Depends(get_current_user)):
    """Save promotions settings (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Save promotion settings
    if "settings" in data:
        await db.app_settings.update_one(
            {"key": "promotions"},
            {"$set": {"key": "promotions", "value": data["settings"]}},
            upsert=True
        )
    
    # Save custom offers
    if "custom_offers" in data:
        await db.app_settings.update_one(
            {"key": "custom_offers"},
            {"$set": {"key": "custom_offers", "value": data["custom_offers"]}},
            upsert=True
        )
    
    return {"success": True, "message": "Promotions saved successfully"}

@api_router.get("/promotions/active")
async def get_active_promotions():
    """Get active promotions for public display (no auth)"""
    settings_doc = await db.app_settings.find_one({"key": "promotions"}, {"_id": 0})
    offers_doc = await db.app_settings.find_one({"key": "custom_offers"}, {"_id": 0})
    
    settings = settings_doc.get("value", {}) if settings_doc else {}
    offers = offers_doc.get("value", []) if offers_doc else []
    
    # Filter only active promotions
    active_offers = [o for o in offers if o.get("active", False)]
    
    return {
        "customer": {
            "active": settings.get("customer_promotion_active", False),
            "message": settings.get("customer_promotion_message", ""),
            "first_visit_discount": settings.get("customer_first_visit_discount", 0),
            "referral_credit": settings.get("customer_referral_credit", 0)
        },
        "rider": {
            "active": settings.get("rider_promotion_active", False),
            "message": settings.get("rider_promotion_message", ""),
            "per_visit_bonus": settings.get("rider_per_visit_bonus", 0),
            "milestone_visits": settings.get("rider_bonus_after_visits", 10),
            "milestone_bonus": settings.get("rider_bonus_amount", 500)
        },
        "seller": {
            "active": settings.get("seller_promotion_active", False),
            "message": settings.get("seller_promotion_message", ""),
            "commission_percent": settings.get("seller_commission_percent", 5),
            "first_deal_bonus": settings.get("seller_bonus_on_first_deal", 1000)
        },
        "promo_codes": active_offers
    }

# ============ ADMIN: MANUAL VISIT CREATION ============

class ManualVisitCreate(BaseModel):
    customer_phone: str
    customer_name: str
    customer_id: Optional[str] = None
    property_ids: List[str]
    preferred_date: str
    preferred_time: str = "10:00"
    payment_method: str = "qr_code"
    payment_amount: float
    payment_reference: Optional[str] = None
    assigned_rider_id: Optional[str] = None
    notes: Optional[str] = None
    property_count: int = 1
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None

@api_router.get("/admin/search-customer")
async def search_customer(phone: str, current_user: dict = Depends(get_current_user)):
    """Search customer by phone number"""
    if current_user['role'] not in ['admin', 'support_admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    customers = await db.users.find(
        {"phone": {"$regex": phone}, "role": "customer"},
        {"_id": 0, "password": 0}
    ).limit(5).to_list(None)
    
    return customers

@api_router.post("/admin/create-manual-visit")
async def create_manual_visit(data: ManualVisitCreate, current_user: dict = Depends(get_current_user)):
    """Create a visit booking for QR code/cash payments"""
    if current_user['role'] not in ['admin', 'support_admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if customer exists, create if not
    customer = await db.users.find_one({"phone": data.customer_phone})
    if not customer:
        # Create new customer account
        customer_id = str(uuid.uuid4())
        temp_password = bcrypt.hashpw("apnaghr123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_customer = {
            "id": customer_id,
            "name": data.customer_name,
            "phone": data.customer_phone,
            "password": temp_password,
            "role": "customer",
            "created_at": datetime.now(timezone.utc),
            "created_by_admin": True
        }
        await db.users.insert_one(new_customer)
        customer = new_customer
    else:
        customer_id = customer.get('id')
    
    # Get property details
    properties = await db.properties.find(
        {"id": {"$in": data.property_ids}},
        {"_id": 0, "id": 1, "title": 1, "area_name": 1, "city": 1, "rent": 1}
    ).to_list(None)
    
    # Create visit package
    package_id = str(uuid.uuid4())
    visit_package = {
        "id": package_id,
        "user_id": customer_id,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "property_ids": data.property_ids,
        "properties": properties,
        "property_count": len(data.property_ids),
        "preferred_date": data.preferred_date,
        "preferred_time": data.preferred_time,
        "status": "confirmed",
        "payment_status": "completed",
        "payment_method": data.payment_method,
        "payment_amount": data.payment_amount,
        "payment_reference": data.payment_reference,
        "created_by": "admin_manual",
        "admin_notes": data.notes,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.visit_packages.insert_one(visit_package)
    
    # Create visit bookings for each property
    visit_ids = []
    for prop in properties:
        visit_id = str(uuid.uuid4())
        visit_booking = {
            "id": visit_id,
            "package_id": package_id,
            "user_id": customer_id,
            "customer_id": customer_id,  # Required for my-bookings endpoint
            "customer_name": data.customer_name,
            "customer_phone": data.customer_phone,
            "property_id": prop["id"],
            "property_ids": [prop["id"]],  # Required for available visits
            "property_title": prop.get("title", ""),
            "property_location": f"{prop.get('area_name', '')}, {prop.get('city', '')}",
            "preferred_date": data.preferred_date,
            "preferred_time": data.preferred_time,
            "scheduled_date": data.preferred_date,  # Alias for compatibility
            "scheduled_time": data.preferred_time,  # Alias for compatibility
            "status": "pending",
            "rider_id": None,  # Required for available visits endpoint
            "assigned_rider_id": data.assigned_rider_id if data.assigned_rider_id else None,
            "current_step": "waiting",  # Required for rider flow
            "current_property_index": 0,
            "total_properties": 1,
            "otp": str(uuid.uuid4().int)[:6],  # Generate OTP for customer verification
            "payment_status": "completed",
            "payment_method": data.payment_method,
            "amount_paid": data.payment_amount / len(data.property_ids),
            "total_earnings": 100,  # ₹100 per property for rider
            "pickup_location": data.pickup_location if hasattr(data, 'pickup_location') and data.pickup_location else "",
            "pickup_lat": data.pickup_lat if hasattr(data, 'pickup_lat') else None,
            "pickup_lng": data.pickup_lng if hasattr(data, 'pickup_lng') else None,
            "created_by": "admin_manual",
            "created_at": datetime.now(timezone.utc)
        }
        await db.visit_bookings.insert_one(visit_booking)
        visit_ids.append(visit_id)
    
    # If rider is assigned, update their assignments
    if data.assigned_rider_id:
        for visit_id in visit_ids:
            await db.visit_bookings.update_one(
                {"id": visit_id},
                {"$set": {"status": "assigned", "rider_id": data.assigned_rider_id, "assigned_rider_id": data.assigned_rider_id}}
            )
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": customer_id,
        "package_id": package_id,
        "amount": data.payment_amount,
        "payment_method": data.payment_method,
        "payment_reference": data.payment_reference,
        "status": "completed",
        "created_by": "admin_manual",
        "admin_id": current_user.get('id'),
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction)
    
    # Create notification for customer
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": customer_id,
        "type": "visit_confirmed",
        "title": "Visit Confirmed!",
        "message": f"Your visit for {len(properties)} properties on {data.preferred_date} has been confirmed. Track your rider in the app!",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    
    return {
        "success": True,
        "message": "Manual visit created successfully",
        "package_id": package_id,
        "visit_ids": visit_ids,
        "customer_id": customer_id,
        "customer_created": customer.get('created_by_admin', False)
    }

@api_router.get("/admin/manual-visits")
async def get_manual_visits(current_user: dict = Depends(get_current_user)):
    """Get recent manual visits"""
    if current_user['role'] not in ['admin', 'support_admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    visits = await db.visit_packages.find(
        {"created_by": "admin_manual"},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(None)
    
    return visits

@api_router.post("/visits/{visit_id}/upload-proof")
async def upload_visit_proof(
    visit_id: str,
    selfie: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    
    if selfie:
        selfie_response = await upload_image(selfie, current_user)
        update_data["visit_proof_selfie"] = selfie_response["url"]
    
    if video:
        video_response = await upload_video(video, current_user)
        update_data["visit_proof_video"] = video_response["url"]
    
    if update_data:
        await db.visit_bookings.update_one({"id": visit_id}, {"$set": update_data})
    
    return {"success": True, "uploaded": update_data}


# ============ ADMIN: TOLET BOARD TASKS ============

@api_router.post("/admin/tolet-tasks")
async def create_tolet_task(task_data: ToLetTaskCreate, current_user: dict = Depends(get_current_user)):
    """Admin creates a new ToLet board collection task"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    task = ToLetTask(
        title=task_data.title,
        description=task_data.description,
        location=task_data.location,
        latitude=task_data.latitude,
        longitude=task_data.longitude,
        rate_per_board=task_data.rate_per_board,
        estimated_boards=task_data.estimated_boards
    )
    
    doc = task.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tolet_tasks.insert_one(doc)
    
    # Notify all online riders
    online_riders = await db.users.find({"role": "rider", "is_online": True}, {"_id": 0}).to_list(100)
    for rider in online_riders:
        notification = Notification(
            user_id=rider['id'],
            type="new_tolet_task",
            title="New ToLet Board Task",
            message=f"New task: {task_data.title} - ₹{task_data.rate_per_board}/board",
            reference_id=task.id,
            reference_type="tolet_task"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    doc.pop('_id', None)
    return doc

@api_router.get("/admin/tolet-tasks")
async def get_all_tolet_tasks(current_user: dict = Depends(get_current_user)):
    """Admin gets all ToLet tasks"""
    if current_user['role'] not in ['admin', 'inventory_admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tasks = await db.tolet_tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Batch fetch all rider info to avoid N+1 queries
    rider_ids = [t['rider_id'] for t in tasks if t.get('rider_id')]
    if rider_ids:
        riders_list = await db.users.find(
            {"id": {"$in": rider_ids}}, 
            {"_id": 0, "password": 0}
        ).to_list(None)
        rider_map = {r['id']: r for r in riders_list}
    else:
        rider_map = {}
    
    for task in tasks:
        if task.get('rider_id'):
            task['rider'] = rider_map.get(task['rider_id'])
    
    return tasks

@api_router.patch("/admin/tolet-tasks/{task_id}")
async def update_tolet_task(task_id: str, update_data: ToLetTaskUpdate, current_user: dict = Depends(get_current_user)):
    """Admin updates ToLet task (rate, etc.)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.tolet_tasks.update_one({"id": task_id}, {"$set": update_dict})
    
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.post("/admin/tolet-tasks/{task_id}/assign")
async def assign_tolet_task(task_id: str, assignment: AssignRider, current_user: dict = Depends(get_current_user)):
    """Admin assigns ToLet task to specific rider"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.tolet_tasks.update_one(
        {"id": task_id, "status": "open"},
        {"$set": {
            "rider_id": assignment.rider_id,
            "assigned_by": current_user['id'],
            "status": "assigned"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Task not available for assignment")
    
    # Notify rider
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    notification = Notification(
        user_id=assignment.rider_id,
        type="task_assigned",
        title="Task Assigned to You",
        message=f"You've been assigned: {task['title']}",
        reference_id=task_id,
        reference_type="tolet_task"
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return task

@api_router.get("/tolet-tasks/available")
async def get_available_tolet_tasks(current_user: dict = Depends(get_current_user)):
    """Rider gets available ToLet tasks"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Get open tasks or tasks assigned to this rider
    tasks = await db.tolet_tasks.find({
        "$or": [
            {"status": "open"},
            {"rider_id": current_user['id'], "status": {"$in": ["assigned", "in_progress"]}}
        ]
    }, {"_id": 0}).to_list(50)
    
    return tasks

@api_router.post("/tolet-tasks/{task_id}/accept")
async def accept_tolet_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Rider accepts an open ToLet task"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    result = await db.tolet_tasks.update_one(
        {"id": task_id, "status": "open"},
        {"$set": {
            "rider_id": current_user['id'],
            "status": "assigned"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Task not available")
    
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.post("/tolet-tasks/{task_id}/start")
async def start_tolet_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Rider starts ToLet task"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    result = await db.tolet_tasks.update_one(
        {"id": task_id, "rider_id": current_user['id'], "status": "assigned"},
        {"$set": {
            "status": "in_progress",
            "started_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot start task")
    
    # Notify admins
    admins = await db.users.find({"role": {"$in": ["admin", "rider_admin"]}}, {"_id": 0}).to_list(50)
    for admin in admins:
        notification = Notification(
            user_id=admin['id'],
            type="task_started",
            title="ToLet Task Started",
            message=f"Rider {current_user['name']} started task",
            reference_id=task_id,
            reference_type="tolet_task"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.post("/tolet-tasks/{task_id}/complete")
async def complete_tolet_task(
    task_id: str, 
    completion_data: ToLetTaskComplete,
    current_user: dict = Depends(get_current_user)
):
    """Rider completes ToLet task with proof images (one per board)"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    task = await db.tolet_tasks.find_one({"id": task_id, "rider_id": current_user['id']}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Validate: must have at least one proof image per board collected
    if len(completion_data.proof_images) < completion_data.boards_collected:
        raise HTTPException(
            status_code=400, 
            detail=f"Please upload at least {completion_data.boards_collected} proof images (one per board collected)"
        )
    
    earnings = completion_data.boards_collected * task['rate_per_board']
    
    # Update task with pending_verification status (not completed until admin approves)
    await db.tolet_tasks.update_one(
        {"id": task_id},
        {"$set": {
            "status": "pending_verification",  # Changed from "completed"
            "actual_boards_collected": completion_data.boards_collected,
            "proof_images": completion_data.proof_images,
            "proof_video": completion_data.proof_video,
            "notes": completion_data.notes,
            "earnings": earnings,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create pending transaction (won't be approved until admin verifies)
    transaction = RiderTransaction(
        rider_id=current_user['id'],
        type="tolet_earning",
        amount=earnings,
        status="pending",
        reference_id=task_id,
        reference_type="tolet_task",
        description=f"ToLet boards collected: {completion_data.boards_collected} x ₹{task['rate_per_board']} (awaiting verification)"
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.rider_transactions.insert_one(trans_doc)
    
    # Update wallet pending earnings
    await db.rider_wallets.update_one(
        {"rider_id": current_user['id']},
        {
            "$inc": {"pending_earnings": earnings, "total_earnings": earnings},
            "$setOnInsert": {"rider_id": current_user['id'], "approved_earnings": 0, "paid_earnings": 0}
        },
        upsert=True
    )
    
    # Notify admins about pending verification
    admins = await db.users.find({"role": {"$in": ["admin", "rider_admin"]}}, {"_id": 0}).to_list(50)
    for admin in admins:
        notification = Notification(
            user_id=admin['id'],
            type="task_pending_verification",
            title="ToLet Task - Photos Need Review",
            message=f"Rider {current_user['name']} submitted {completion_data.boards_collected} board photos - ₹{earnings} pending your verification",
            reference_id=task_id,
            reference_type="tolet_task"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    return {"success": True, "earnings": earnings, "status": "pending_verification", "message": "Photos submitted for admin verification"}


@api_router.post("/admin/tolet-tasks/{task_id}/verify")
async def verify_tolet_task(
    task_id: str,
    approved: bool,
    rejection_reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Admin verifies/rejects ToLet task photos and approves payout"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task['status'] != 'pending_verification':
        raise HTTPException(status_code=400, detail="Task is not pending verification")
    
    if approved:
        # Approve the task
        await db.tolet_tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "verified",
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "verified_by": current_user['id']
            }}
        )
        
        # Approve the transaction
        await db.rider_transactions.update_one(
            {"reference_id": task_id, "reference_type": "tolet_task"},
            {"$set": {"status": "approved"}}
        )
        
        # Move from pending to approved earnings
        await db.rider_wallets.update_one(
            {"rider_id": task['rider_id']},
            {"$inc": {
                "pending_earnings": -task['earnings'],
                "approved_earnings": task['earnings']
            }}
        )
        
        # Notify rider
        notification = Notification(
            user_id=task['rider_id'],
            type="task_verified",
            title="Task Approved! 🎉",
            message=f"Your ToLet task was verified. ₹{task['earnings']} added to your wallet!",
            reference_id=task_id,
            reference_type="tolet_task"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
        
        return {"success": True, "status": "verified", "earnings_approved": task['earnings']}
    else:
        # Reject the task
        await db.tolet_tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": rejection_reason or "Photos did not meet requirements",
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "verified_by": current_user['id']
            }}
        )
        
        # Cancel the transaction
        await db.rider_transactions.update_one(
            {"reference_id": task_id, "reference_type": "tolet_task"},
            {"$set": {"status": "rejected", "description": f"Rejected: {rejection_reason}"}}
        )
        
        # Remove from pending earnings
        await db.rider_wallets.update_one(
            {"rider_id": task['rider_id']},
            {"$inc": {
                "pending_earnings": -task['earnings'],
                "total_earnings": -task['earnings']
            }}
        )
        
        # Notify rider
        notification = Notification(
            user_id=task['rider_id'],
            type="task_rejected",
            title="Task Rejected",
            message=f"Your ToLet task was rejected: {rejection_reason or 'Photos did not meet requirements'}. Please resubmit with valid photos.",
            reference_id=task_id,
            reference_type="tolet_task"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
        
        return {"success": True, "status": "rejected", "reason": rejection_reason}


@api_router.get("/admin/tolet-tasks/pending-verification")
async def get_tolet_tasks_pending_verification(current_user: dict = Depends(get_current_user)):
    """Get all ToLet tasks that need photo verification"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tasks = await db.tolet_tasks.find(
        {"status": "pending_verification"},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(100)
    
    # Enrich with rider info
    for task in tasks:
        if task.get('rider_id'):
            rider = await db.users.find_one({"id": task['rider_id']}, {"_id": 0, "password": 0})
            task['rider'] = rider
    
    return tasks


# ============ ADMIN: VISIT MANAGEMENT & ASSIGNMENT ============

@api_router.get("/admin/visits/all")
async def get_all_visits(current_user: dict = Depends(get_current_user)):
    """Admin gets all visits"""
    if current_user['role'] not in ['admin', 'support_admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        visits = await db.visit_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        # Batch fetch all users to avoid N+1 queries
        user_ids = set()
        for visit in visits:
            if visit.get('customer_id'):
                user_ids.add(visit.get('customer_id'))
            if visit.get('rider_id'):
                user_ids.add(visit['rider_id'])
        
        users = await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "password": 0}).to_list(None)
        user_map = {u['id']: u for u in users}
        
        # Enrich with customer and rider info using batch data
        for visit in visits:
            visit['customer'] = user_map.get(visit.get('customer_id'))
            if visit.get('rider_id'):
                visit['rider'] = user_map.get(visit['rider_id'])
        
        # Sanitize all documents to handle any ObjectId references
        return sanitize_mongo_doc(visits)
    except Exception as e:
        import traceback
        print(f"ERROR in get_all_visits: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@api_router.get("/admin/visits/pending-approval")
async def get_visits_pending_approval(current_user: dict = Depends(get_current_user)):
    """Admin gets visits that need approval (completed but not verified)"""
    if current_user['role'] not in ['admin', 'support_admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    visits = await db.visit_bookings.find(
        {"status": "completed", "admin_verified": {"$ne": True}},
        {"_id": 0}
    ).sort("visit_end_time", -1).to_list(50)
    
    # Batch fetch all users and properties to avoid N+1 queries
    user_ids = set()
    property_ids = set()
    for visit in visits:
        user_ids.add(visit.get('customer_id'))
        if visit.get('rider_id'):
            user_ids.add(visit['rider_id'])
        for prop_id in visit.get('property_ids', []):
            property_ids.add(prop_id)
    
    users = await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "password": 0}).to_list(None)
    user_map = {u['id']: u for u in users}
    
    properties = await db.properties.find({"id": {"$in": list(property_ids)}}, {"_id": 0}).to_list(None)
    prop_map = {p['id']: p for p in properties}
    
    # Enrich with details using batch data
    for visit in visits:
        visit['customer'] = user_map.get(visit.get('customer_id'))
        if visit.get('rider_id'):
            visit['rider'] = user_map.get(visit['rider_id'])
        visit['properties'] = [prop_map[pid] for pid in visit.get('property_ids', []) if pid in prop_map]
    
    return visits

@api_router.post("/admin/visits/{visit_id}/assign")
async def admin_assign_visit(visit_id: str, assignment: AssignRider, current_user: dict = Depends(get_current_user)):
    """Admin assigns visit to specific rider"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.visit_bookings.update_one(
        {"id": visit_id, "status": "pending"},
        {"$set": {
            "rider_id": assignment.rider_id,
            "status": "rider_assigned",
            "current_step": "go_to_customer",
            "assigned_by_admin": current_user['id']
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Visit not available for assignment")
    
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    
    # Notify rider
    notification = Notification(
        user_id=assignment.rider_id,
        type="visit_assigned",
        title="Visit Assigned to You",
        message=f"Admin assigned you a visit with {len(visit.get('property_ids', []))} properties",
        reference_id=visit_id,
        reference_type="visit"
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return visit

@api_router.post("/admin/visits/{visit_id}/approve")
async def approve_visit(visit_id: str, approval: VisitApproval, current_user: dict = Depends(get_current_user)):
    """Admin approves a completed visit and credits rider wallet"""
    if current_user['role'] not in ['admin', 'support_admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    if not approval.approved:
        # Reject the visit
        await db.visit_bookings.update_one(
            {"id": visit_id},
            {"$set": {
                "admin_verified": True,
                "admin_approved": False,
                "rejection_reason": approval.rejection_reason,
                "verified_by": current_user['id'],
                "verified_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update transaction to rejected
        await db.rider_transactions.update_one(
            {"reference_id": visit_id, "reference_type": "visit", "status": "pending"},
            {"$set": {"status": "rejected"}}
        )
        
        # Notify rider
        notification = Notification(
            user_id=visit['rider_id'],
            type="visit_rejected",
            title="Visit Rejected",
            message=f"Your visit was rejected: {approval.rejection_reason}",
            reference_id=visit_id,
            reference_type="visit"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
        
        return {"success": True, "status": "rejected"}
    
    # Approve the visit
    earnings = visit.get('total_earnings', 0)
    
    await db.visit_bookings.update_one(
        {"id": visit_id},
        {"$set": {
            "admin_verified": True,
            "admin_approved": True,
            "verified_by": current_user['id'],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update transaction to approved
    await db.rider_transactions.update_one(
        {"reference_id": visit_id, "reference_type": "visit", "status": "pending"},
        {"$set": {
            "status": "approved",
            "approved_by": current_user['id'],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Move earnings from pending to approved in wallet
    await db.rider_wallets.update_one(
        {"rider_id": visit['rider_id']},
        {"$inc": {"pending_earnings": -earnings, "approved_earnings": earnings}}
    )
    
    # Notify rider
    notification = Notification(
        user_id=visit['rider_id'],
        type="visit_approved",
        title="Visit Approved!",
        message=f"Your visit was approved! ₹{earnings} added to your wallet",
        reference_id=visit_id,
        reference_type="visit"
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"success": True, "status": "approved", "earnings_credited": earnings}


# ============ ADMIN: TOLET TASK APPROVAL ============

@api_router.get("/admin/tolet-tasks/pending-approval")
async def get_tolet_tasks_pending_approval(current_user: dict = Depends(get_current_user)):
    """Admin gets ToLet tasks that need approval"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tasks = await db.tolet_tasks.find({"status": "completed"}, {"_id": 0}).to_list(50)
    
    # Batch fetch all riders to avoid N+1 queries
    rider_ids = [t.get('rider_id') for t in tasks if t.get('rider_id')]
    riders = await db.users.find({"id": {"$in": rider_ids}}, {"_id": 0, "password": 0}).to_list(None)
    rider_map = {r['id']: r for r in riders}
    
    for task in tasks:
        if task.get('rider_id'):
            task['rider'] = rider_map.get(task['rider_id'])
    
    return tasks

@api_router.post("/admin/tolet-tasks/{task_id}/approve")
async def approve_tolet_task(task_id: str, approval: VisitApproval, current_user: dict = Depends(get_current_user)):
    """Admin approves ToLet task"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    task = await db.tolet_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    earnings = task.get('earnings', 0)
    rider_id = task.get('rider_id')
    
    if not approval.approved:
        await db.tolet_tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": approval.rejection_reason,
                "verified_by": current_user['id'],
                "verified_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await db.rider_transactions.update_one(
            {"reference_id": task_id, "status": "pending"},
            {"$set": {"status": "rejected"}}
        )
        
        # Remove from pending earnings
        await db.rider_wallets.update_one(
            {"rider_id": rider_id},
            {"$inc": {"pending_earnings": -earnings, "total_earnings": -earnings}}
        )
        
        return {"success": True, "status": "rejected"}
    
    # Approve
    await db.tolet_tasks.update_one(
        {"id": task_id},
        {"$set": {
            "status": "verified",
            "verified_by": current_user['id'],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.rider_transactions.update_one(
        {"reference_id": task_id, "status": "pending"},
        {"$set": {
            "status": "approved",
            "approved_by": current_user['id'],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Move to approved earnings
    await db.rider_wallets.update_one(
        {"rider_id": rider_id},
        {"$inc": {"pending_earnings": -earnings, "approved_earnings": earnings}}
    )
    
    # Notify rider
    notification = Notification(
        user_id=rider_id,
        type="task_approved",
        title="Task Approved!",
        message=f"ToLet task approved! ₹{earnings} added to wallet",
        reference_id=task_id,
        reference_type="tolet_task"
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"success": True, "status": "approved", "earnings": earnings}


# ============ RIDER WALLET ============

@api_router.get("/rider/wallet")
async def get_rider_wallet(current_user: dict = Depends(get_current_user)):
    """Get rider's wallet balance"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    wallet = await db.rider_wallets.find_one({"rider_id": current_user['id']}, {"_id": 0})
    
    if not wallet:
        # Create empty wallet
        wallet = {
            "rider_id": current_user['id'],
            "total_earnings": 0,
            "pending_earnings": 0,
            "approved_earnings": 0,
            "paid_earnings": 0,
            "next_payout_date": get_next_biweekly_date()
        }
        await db.rider_wallets.insert_one(wallet)
        # Remove _id that MongoDB adds after insert
        wallet.pop('_id', None)
    
    wallet['next_payout_date'] = get_next_biweekly_date()
    return wallet

def get_next_biweekly_date():
    """Calculate next bi-weekly payout date (1st and 15th of month)"""
    today = datetime.now(timezone.utc)
    if today.day < 15:
        next_date = today.replace(day=15)
    else:
        # Next month 1st
        if today.month == 12:
            next_date = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_date = today.replace(month=today.month + 1, day=1)
    return next_date.strftime("%Y-%m-%d")

@api_router.get("/rider/wallet/transactions")
async def get_rider_transactions(current_user: dict = Depends(get_current_user)):
    """Get rider's transaction history"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    transactions = await db.rider_transactions.find(
        {"rider_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(None)
    
    return transactions

@api_router.get("/admin/riders/wallets")
async def get_all_rider_wallets(current_user: dict = Depends(get_current_user)):
    """Admin gets all rider wallets"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    wallets = await db.rider_wallets.find({}, {"_id": 0}).to_list(100)
    
    # Batch fetch all riders to avoid N+1 queries
    rider_ids = [w.get('rider_id') for w in wallets if w.get('rider_id')]
    riders = await db.users.find({"id": {"$in": rider_ids}}, {"_id": 0, "password": 0}).to_list(None)
    rider_map = {r['id']: r for r in riders}
    
    for wallet in wallets:
        wallet['rider'] = rider_map.get(wallet.get('rider_id'))
    
    return wallets

@api_router.post("/admin/payouts/process")
async def process_payouts(current_user: dict = Depends(get_current_user)):
    """Admin processes bi-weekly payouts"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get all wallets with approved earnings
    wallets = await db.rider_wallets.find({"approved_earnings": {"$gt": 0}}, {"_id": 0}).to_list(100)
    
    payouts = []
    for wallet in wallets:
        amount = wallet['approved_earnings']
        
        # Create payout transaction
        transaction = RiderTransaction(
            rider_id=wallet['rider_id'],
            type="payout",
            amount=-amount,
            status="paid",
            description=f"Bi-weekly payout",
            paid_at=datetime.now(timezone.utc).isoformat()
        )
        trans_doc = transaction.model_dump()
        trans_doc['created_at'] = trans_doc['created_at'].isoformat()
        await db.rider_transactions.insert_one(trans_doc)
        
        # Update wallet
        await db.rider_wallets.update_one(
            {"rider_id": wallet['rider_id']},
            {
                "$set": {"approved_earnings": 0, "last_payout_date": datetime.now(timezone.utc).isoformat()},
                "$inc": {"paid_earnings": amount}
            }
        )
        
        # Notify rider
        notification = Notification(
            user_id=wallet['rider_id'],
            type="payout_processed",
            title="Payout Processed!",
            message=f"₹{amount} has been transferred to your account",
            reference_type="payout"
        )
        notif_doc = notification.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        await db.notifications.insert_one(notif_doc)
        
        payouts.append({"rider_id": wallet['rider_id'], "amount": amount})
    
    return {"success": True, "payouts_processed": len(payouts), "payouts": payouts}


# ============ NOTIFICATIONS ============

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(None)
    
    unread_count = await db.notifications.count_documents({"user_id": current_user['id'], "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(notification_ids: List[str] = None, current_user: dict = Depends(get_current_user)):
    """Mark notifications as read"""
    if notification_ids:
        await db.notifications.update_many(
            {"id": {"$in": notification_ids}, "user_id": current_user['id']},
            {"$set": {"read": True}}
        )
    else:
        # Mark all as read
        await db.notifications.update_many(
            {"user_id": current_user['id']},
            {"$set": {"read": True}}
        )
    
    return {"success": True}


# ============ CUSTOMER PROFILE & WALLET ============

class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

@api_router.put("/customer/profile")
async def update_customer_profile(data: CustomerProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update customer profile"""
    update_data = {}
    if data.name:
        update_data['name'] = data.name
    if data.email:
        update_data['email'] = data.email
    if data.address:
        update_data['address'] = data.address
    if data.address_lat:
        update_data['address_lat'] = data.address_lat
    if data.address_lng:
        update_data['address_lng'] = data.address_lng
    
    if update_data:
        await db.users.update_one({"id": current_user['id']}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    return {"success": True, "user": updated_user}

@api_router.get("/customer/wallet")
async def get_customer_wallet(current_user: dict = Depends(get_current_user)):
    """Get customer wallet with stats"""
    # Count completed visits
    total_visits = await db.visit_bookings.count_documents({
        "$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}],
        "status": "completed"
    })
    
    # Sum total spent
    pipeline = [
        {"$match": {"$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}]}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    spent_result = await db.visit_bookings.aggregate(pipeline).to_list(1)
    total_spent = spent_result[0]['total'] if spent_result else 0
    
    # Count properties viewed (from cart history or visits)
    properties_viewed = await db.visit_bookings.count_documents({
        "$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}]
    })
    
    # Get visit packages/credits - check BOTH customer_id and user_id
    packages = await db.visit_packages.find(
        {"$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}]},
        {"_id": 0}
    ).to_list(20)
    
    # Calculate available visits from valid packages only
    now = datetime.now(timezone.utc).isoformat()
    valid_packages = []
    visits_available = 0
    for p in packages:
        valid_until = p.get('valid_until', '')
        if valid_until and valid_until > now:
            remaining = max(0, (p.get('total_visits') or 0) - (p.get('visits_used') or 0))
            visits_available += remaining
            valid_packages.append(p)
    
    return sanitize_mongo_doc({
        "total_visits": total_visits,
        "total_spent": total_spent or 0,
        "properties_viewed": properties_viewed,
        "visits_available": visits_available,
        "packages": valid_packages
    })

@api_router.get("/customer/payments")
async def get_customer_payment_history(current_user: dict = Depends(get_current_user)):
    """Get customer payment history"""
    payments = await db.payment_transactions.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(None)
    
    return sanitize_mongo_doc(payments)


# ============ RIDER PROFILE & BANK ACCOUNT ============

class RiderBankAccount(BaseModel):
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    upi_id: Optional[str] = None

class RiderProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    profile_complete: Optional[bool] = None

@api_router.put("/rider/profile")
async def update_rider_profile(data: RiderProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update rider profile"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    update_data = {}
    if data.name:
        update_data['name'] = data.name
    if data.email:
        update_data['email'] = data.email
    if data.address:
        update_data['address'] = data.address
    if data.vehicle_type:
        update_data['vehicle_type'] = data.vehicle_type
    if data.vehicle_number:
        update_data['vehicle_number'] = data.vehicle_number
    if data.profile_complete is not None:
        update_data['profile_complete'] = data.profile_complete
    
    if update_data:
        await db.users.update_one({"id": current_user['id']}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    return {"success": True, "user": updated_user}

@api_router.get("/rider/profile")
async def get_rider_profile(current_user: dict = Depends(get_current_user)):
    """Get rider profile with bank details"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    bank_account = await db.rider_bank_accounts.find_one({"rider_id": current_user['id']}, {"_id": 0})
    
    return {
        "profile": rider,
        "bank_account": bank_account,
        "profile_complete": rider.get('profile_complete', False)
    }

@api_router.post("/rider/bank-account")
async def add_rider_bank_account(data: RiderBankAccount, current_user: dict = Depends(get_current_user)):
    """Add or update rider bank account for payouts"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    bank_doc = {
        "rider_id": current_user['id'],
        "account_holder_name": data.account_holder_name,
        "account_number": data.account_number,
        "ifsc_code": data.ifsc_code.upper(),
        "bank_name": data.bank_name,
        "upi_id": data.upi_id,
        "verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert bank account
    await db.rider_bank_accounts.update_one(
        {"rider_id": current_user['id']},
        {"$set": bank_doc},
        upsert=True
    )
    
    # Mark profile as complete if bank added
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"bank_account_added": True}}
    )
    
    return {"success": True, "message": "Bank account added successfully"}

@api_router.get("/rider/bank-account")
async def get_rider_bank_account(current_user: dict = Depends(get_current_user)):
    """Get rider bank account details"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    bank_account = await db.rider_bank_accounts.find_one({"rider_id": current_user['id']}, {"_id": 0})
    
    if bank_account:
        # Mask account number for security
        acc_num = bank_account.get('account_number', '')
        bank_account['account_number_masked'] = f"XXXX{acc_num[-4:]}" if len(acc_num) >= 4 else acc_num
    
    return bank_account


# ============ CUSTOMER VISIT MODIFICATION (For Admin-Created Visits) ============

class VisitModification(BaseModel):
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None

@api_router.put("/customer/visits/{visit_id}/modify")
async def modify_customer_visit(visit_id: str, data: VisitModification, current_user: dict = Depends(get_current_user)):
    """Allow customer to modify time/date/location for admin-created visits"""
    # Find the visit
    visit = await db.visit_bookings.find_one({
        "id": visit_id,
        "$or": [
            {"customer_id": current_user['id']},
            {"user_id": current_user['id']},
            {"customer_phone": current_user.get('phone')}
        ]
    })
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Only allow modification for pending/assigned visits (not in-progress)
    if visit.get('status') not in ['pending', 'confirmed', 'assigned']:
        raise HTTPException(status_code=400, detail="Cannot modify visit that is already in progress")
    
    update_data = {}
    if data.scheduled_date:
        update_data['scheduled_date'] = data.scheduled_date
        update_data['preferred_date'] = data.scheduled_date
    if data.scheduled_time:
        update_data['scheduled_time'] = data.scheduled_time
        update_data['preferred_time'] = data.scheduled_time
    if data.pickup_location:
        update_data['pickup_location'] = data.pickup_location
    if data.pickup_lat:
        update_data['pickup_lat'] = data.pickup_lat
    if data.pickup_lng:
        update_data['pickup_lng'] = data.pickup_lng
    
    update_data['customer_confirmed'] = True
    update_data['customer_confirmed_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.visit_bookings.update_one({"id": visit_id}, {"$set": update_data})
    
    updated_visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    return {"success": True, "visit": updated_visit}


# ============ LIVE TRACKING ============

@api_router.get("/admin/visits/{visit_id}/tracking")
async def get_visit_tracking(visit_id: str, current_user: dict = Depends(get_current_user)):
    """Admin gets live tracking for a visit"""
    if current_user['role'] not in ['admin', 'rider_admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    rider = None
    if visit.get('rider_id'):
        rider = await db.users.find_one({"id": visit['rider_id']}, {"_id": 0, "password": 0})
    
    customer = await db.users.find_one({"id": visit['customer_id']}, {"_id": 0, "password": 0})
    
    properties = []
    for prop_id in visit.get('property_ids', []):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if prop:
            properties.append(prop)
    
    return {
        "visit": visit,
        "rider": rider,
        "customer": customer,
        "properties": properties,
        "rider_location": {
            "lat": rider.get('current_lat') if rider else None,
            "lng": rider.get('current_lng') if rider else None,
            "last_update": rider.get('last_location_update') if rider else None
        }
    }

@api_router.get("/admin/riders/live-locations")
async def get_live_rider_locations(current_user: dict = Depends(get_current_user)):
    """Admin gets all online riders' locations"""
    if current_user['role'] not in ['admin', 'rider_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    riders = await db.users.find(
        {"role": "rider", "is_online": True},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Get active visits for each rider
    for rider in riders:
        active_visit = await db.visit_bookings.find_one(
            {"rider_id": rider['id'], "status": {"$nin": ["completed", "cancelled", "pending"]}},
            {"_id": 0}
        )
        rider['active_visit'] = active_visit
        
        active_task = await db.tolet_tasks.find_one(
            {"rider_id": rider['id'], "status": "in_progress"},
            {"_id": 0}
        )
        rider['active_task'] = active_task
    
    return riders


# ============ PROPERTY ANALYTICS & STATUS ============

@api_router.get("/admin/properties")
async def get_all_admin_properties(current_user: dict = Depends(get_current_user)):
    """Get all properties for admin inventory"""
    if current_user['role'] not in ['admin', 'inventory_admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    properties = await db.properties.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return properties


@api_router.get("/admin/server-files")
async def get_server_files(current_user: dict = Depends(get_current_user)):
    """Get list of uploaded files on server"""
    if current_user['role'] not in ['admin', 'inventory_admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    uploads_dir = "/app/uploads"
    images = []
    videos = []
    
    if os.path.exists(uploads_dir):
        for filename in os.listdir(uploads_dir):
            filepath = f"/api/uploads/{filename}"
            if filename.endswith(('.mp4', '.mov', '.avi', '.webm')):
                videos.append(filepath)
            elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                images.append(filepath)
    
    return {"images": images, "videos": videos}



@api_router.put("/admin/properties/{property_id}")
async def update_admin_property(property_id: str, property_data: PropertyCreate, current_user: dict = Depends(get_current_user)):
    """Update a property"""
    if current_user['role'] not in ['admin', 'inventory_admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = property_data.model_dump()
    result = await db.properties.update_one(
        {"id": property_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    updated = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return updated


@api_router.get("/admin/properties/analytics")
async def get_property_analytics(current_user: dict = Depends(get_current_user)):
    """Get property analytics with visit counts and status"""
    if current_user['role'] not in ['admin', 'inventory_admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all properties with analytics
    properties = await db.properties.find({}, {"_id": 0}).sort("visit_count", -1).to_list(200)
    
    # Calculate properties needing status check (not checked in 24 hours)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    needs_verification = [p for p in properties if not p.get('last_status_check') or p.get('last_status_check', '') < cutoff]
    
    # Get visit bookings to calculate recent visits per property
    recent_visits = await db.visit_bookings.find(
        {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}},
        {"_id": 0, "property_ids": 1}
    ).to_list(500)
    
    # Count visits per property
    visit_counts = {}
    for visit in recent_visits:
        for prop_id in visit.get('property_ids', []):
            visit_counts[prop_id] = visit_counts.get(prop_id, 0) + 1
    
    # Update weekly visits in response
    for prop in properties:
        prop['weekly_visits'] = visit_counts.get(prop['id'], 0)
        prop['needs_verification'] = prop['id'] in [p['id'] for p in needs_verification]
    
    # Summary stats
    summary = {
        "total_properties": len(properties),
        "available": len([p for p in properties if p.get('status') == 'available']),
        "rented": len([p for p in properties if p.get('status') == 'rented']),
        "under_verification": len([p for p in properties if p.get('status') == 'under_verification']),
        "needs_daily_check": len(needs_verification),
        "hot_properties": len([p for p in properties if p.get('is_hot')]),
        "total_weekly_visits": sum(visit_counts.values())
    }
    
    return {"properties": properties, "summary": summary}

@api_router.get("/admin/properties/needs-verification")
async def get_properties_needing_verification(current_user: dict = Depends(get_current_user)):
    """Get properties that need daily status verification"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    
    properties = await db.properties.find({
        "status": {"$in": ["available", "under_verification"]},
        "$or": [
            {"last_status_check": None},
            {"last_status_check": {"$lt": cutoff}}
        ]
    }, {"_id": 0}).to_list(100)
    
    return properties

@api_router.post("/admin/properties/{property_id}/verify-status")
async def verify_property_status(property_id: str, status_update: PropertyStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Admin verifies/updates property status"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {
        "status": status_update.status,
        "last_status_check": datetime.now(timezone.utc).isoformat(),
        "status_verified_by": current_user['id'],
        "available": status_update.status == "available"
    }
    
    if status_update.notes:
        update_data["status_notes"] = status_update.notes
    
    # If rented, mark as not available
    if status_update.status == "rented":
        update_data["available"] = False
        update_data["is_hot"] = False
    
    await db.properties.update_one({"id": property_id}, {"$set": update_data})
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return prop

@api_router.post("/admin/properties/{property_id}/mark-hot")
async def mark_property_hot(property_id: str, is_hot: bool = True, current_user: dict = Depends(get_current_user)):
    """Mark property as hot/high-demand"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.properties.update_one({"id": property_id}, {"$set": {"is_hot": is_hot}})
    return {"success": True, "is_hot": is_hot}

@api_router.post("/admin/properties/auto-mark-hot")
async def auto_mark_hot_properties(current_user: dict = Depends(get_current_user)):
    """Automatically mark top visited properties as hot"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get visit counts from last 7 days
    recent_visits = await db.visit_bookings.find(
        {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}},
        {"_id": 0, "property_ids": 1}
    ).to_list(500)
    
    visit_counts = {}
    for visit in recent_visits:
        for prop_id in visit.get('property_ids', []):
            visit_counts[prop_id] = visit_counts.get(prop_id, 0) + 1
    
    # Mark top 10% as hot
    if visit_counts:
        sorted_props = sorted(visit_counts.items(), key=lambda x: x[1], reverse=True)
        hot_threshold = max(1, len(sorted_props) // 10)
        hot_ids = [p[0] for p in sorted_props[:hot_threshold]]
        
        # Reset all hot status
        await db.properties.update_many({}, {"$set": {"is_hot": False}})
        
        # Mark new hot properties
        await db.properties.update_many(
            {"id": {"$in": hot_ids}, "status": "available"},
            {"$set": {"is_hot": True}}
        )
        
        return {"success": True, "hot_properties_count": len(hot_ids)}
    
    return {"success": True, "hot_properties_count": 0}

@api_router.get("/properties/{property_id}/popularity")
async def get_property_popularity(property_id: str):
    """Get property popularity info (public - for customers)"""
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Count visits in last 7 days
    recent_visits = await db.visit_bookings.count_documents({
        "property_ids": property_id,
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    return {
        "weekly_visits": recent_visits,
        "is_hot": prop.get('is_hot', False),
        "total_visits": prop.get('visit_count', 0)
    }

@api_router.get("/property/{property_id}/public")
async def get_property_public(property_id: str):
    """Get property info for owner location page (public - no auth required)"""
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0, "owner_phone": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {
        "id": prop.get("id"),
        "title": prop.get("title"),
        "exact_address": prop.get("exact_address"),
        "area_name": prop.get("area_name"),
        "city": prop.get("city"),
        "latitude": prop.get("latitude"),
        "longitude": prop.get("longitude")
    }

@api_router.put("/property/{property_id}/location")
async def update_property_location(property_id: str, location_data: dict):
    """Update property GPS location (public - for owners to add location)"""
    prop = await db.properties.find_one({"id": property_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    latitude = location_data.get("latitude")
    longitude = location_data.get("longitude")
    
    if not latitude or not longitude:
        raise HTTPException(status_code=400, detail="Latitude and longitude required")
    
    await db.properties.update_one(
        {"id": property_id},
        {"$set": {
            "latitude": latitude,
            "longitude": longitude,
            "location_updated_at": datetime.now(timezone.utc).isoformat(),
            "location_updated_by": "owner"
        }}
    )
    
    return {"success": True, "message": "Location updated successfully"}

# Setup AI Chatbot routes (must be before including router)
setup_chatbot_routes(api_router, db, get_current_user)

# Setup Seller routes
setup_seller_routes(api_router, db, get_current_user, bcrypt)

app.include_router(api_router)

# Include new modular routes
app.include_router(packers_router, prefix="/api")
app.include_router(advertising_router, prefix="/api")
app.include_router(tracking_router, prefix="/api")
app.include_router(builder_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(seller_leads_router, prefix="/api")
app.include_router(ai_validation_router, prefix="/api")
app.include_router(seller_performance_router, prefix="/api")
app.include_router(inventory_access_router, prefix="/api/inventory")
app.include_router(seller_verification_router, prefix="/api/seller-verification")

# ============ TEST/DEMO ENDPOINT FOR MULTI-VISIT ============
@app.post("/api/demo/create-multi-visit")
async def create_demo_multi_visit():
    """Create a demo multi-property visit for testing route optimization"""
    import uuid
    
    # Get 3 random properties with coordinates
    properties = await db.properties.find(
        {"latitude": {"$exists": True, "$ne": None}},
        {"_id": 0}
    ).limit(3).to_list(length=3)
    
    if len(properties) < 3:
        # Create demo properties with Chandigarh coordinates
        demo_properties = [
            {"id": f"demo_{uuid.uuid4().hex[:8]}", "title": "3BHK in Sector 17", 
             "latitude": 30.7046, "longitude": 76.7179, "rent": 25000, "bhk": 3,
             "address": "Sector 17, Chandigarh", "city": "Chandigarh"},
            {"id": f"demo_{uuid.uuid4().hex[:8]}", "title": "2BHK in Sector 22", 
             "latitude": 30.7333, "longitude": 76.7794, "rent": 18000, "bhk": 2,
             "address": "Sector 22, Chandigarh", "city": "Chandigarh"},
            {"id": f"demo_{uuid.uuid4().hex[:8]}", "title": "1BHK in Sector 35", 
             "latitude": 30.7000, "longitude": 76.7500, "rent": 12000, "bhk": 1,
             "address": "Sector 35, Chandigarh", "city": "Chandigarh"},
        ]
        for prop in demo_properties:
            await db.properties.update_one({"id": prop["id"]}, {"$set": prop}, upsert=True)
        properties = demo_properties
    
    # Create a multi-property visit booking
    visit_id = f"visit_{uuid.uuid4().hex[:12]}"
    visit = {
        "id": visit_id,
        "customer_id": "demo_customer",
        "property_ids": [p["id"] for p in properties],
        "status": "pending",
        "scheduled_date": datetime.now(timezone.utc).isoformat(),
        "scheduled_time": "10:00 AM",
        "pickup_location": "Sector 17 Bus Stand, Chandigarh",
        "package_type": "three_visits",
        "amount_paid": 350,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.visit_bookings.insert_one(visit)
    
    return {
        "visit_id": visit_id,
        "properties": [{"id": p["id"], "title": p["title"], "lat": p.get("latitude"), "lng": p.get("longitude")} for p in properties],
        "message": "Demo multi-property visit created. Rider can now accept this visit to see route optimization.",
        "status": "pending"
    }

# Mount uploads directory for serving files
# Using /api/uploads to ensure proper routing through Kubernetes ingress
app.mount("/api/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event - seed default accounts if not exist
@app.on_event("startup")
async def seed_default_accounts():
    """Create default admin and test accounts on first run"""
    
    # Create database indexes for faster queries
    try:
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("id")
        await db.users.create_index("role")
        await db.properties.create_index("id")
        await db.properties.create_index("city")
        await db.properties.create_index("status")
        await db.properties.create_index([("city", 1), ("status", 1)])
        await db.seller_daily_activity.create_index([("seller_id", 1), ("date", 1)])
        await db.seller_daily_activity.create_index("date")
        await db.visit_bookings.create_index("customer_id")
        await db.visit_bookings.create_index("rider_id")
        await db.visit_bookings.create_index("status")
        await db.seller_client_referrals.create_index([("seller_id", 1), ("verification_status", 1)])
        logger.info("Database indexes created/verified")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
    
    # First, seed production data from preview export (if available)
    try:
        from seed_production import seed_production_data
        await seed_production_data(db)
    except Exception as e:
        logger.warning(f"Production seeding skipped: {str(e)}")
    
    # Then create default accounts if they don't exist
    default_accounts = [
        {"name": "Admin User", "phone": "7777777777", "password": "admin123", "role": "admin"},
        {"name": "Test Customer", "phone": "6987654321", "password": "newpass123", "role": "customer"},
        {"name": "Test Rider", "phone": "6111222333", "password": "rider123", "role": "rider"},
        {"name": "Test Advertiser", "phone": "6222333444", "password": "adv123", "role": "advertiser"},
        {"name": "Test Builder", "phone": "6333444555", "password": "build123", "role": "builder"},
    ]
    
    for account in default_accounts:
        existing = await db.users.find_one({"phone": account["phone"]})
        if not existing:
            user = User(
                name=account["name"],
                phone=account["phone"],
                password=hash_password(account["password"]),
                role=account["role"]
            )
            doc = user.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            logger.info(f"Created default {account['role']} account: {account['phone']}")
        else:
            logger.info(f"Account already exists: {account['phone']}")

# Health check endpoint for production keep-alive (outside /api prefix)
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes/load balancer"""
    try:
        # Check MongoDB connection
        await client.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "version": "2.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()