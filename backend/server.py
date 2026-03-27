from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Payment packages
PAYMENT_PACKAGES = {
    "single_visit": {"amount": 200.0, "visits": 1, "validity_days": 3},
    "three_visits": {"amount": 350.0, "visits": 3, "validity_days": 7},
    "five_visits": {"amount": 500.0, "visits": 5, "validity_days": 10},
    "property_lock": {"amount": 999.0, "type": "lock"}
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitBookingCreate(BaseModel):
    property_ids: List[str]  # Can book multiple properties
    package_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    pickup_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None

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
@api_router.post("/auth/register", response_model=User)
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
    
    response_user = user_obj.model_dump()
    response_user.pop('password', None)
    return response_user

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"phone": login_data.phone}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['role'])
    user.pop('password', None)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

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
    if city:
        query["city"] = city
    if min_rent:
        query.setdefault("rent", {})["$gte"] = min_rent
    if max_rent:
        query.setdefault("rent", {})["$lte"] = max_rent
    if bhk:
        query["bhk"] = bhk
    if furnishing:
        query["furnishing"] = furnishing
    
    properties = await db.properties.find(query, {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0}).limit(50).to_list(None)
    return properties

@api_router.get("/properties/{property_id}")
async def get_property(property_id: str, current_user: dict = Depends(get_current_user)):
    property_data = await db.properties.find_one({"id": property_id}, {"_id": 0, "exact_address": 0, "latitude": 0, "longitude": 0})
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_data

# Payment endpoints
@api_router.post("/payments/checkout")
async def create_checkout(
    package_id: str,
    origin_url: str,
    property_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if package_id not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PAYMENT_PACKAGES[package_id]
    amount = package["amount"]
    
    backend_url = os.environ.get('BACKEND_URL', origin_url)
    webhook_url = f"{backend_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancelled"
    
    metadata = {
        "user_id": current_user['id'],
        "package_id": package_id,
        "property_id": property_id or ""
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="inr",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        user_id=current_user['id'],
        session_id=session.session_id,
        amount=amount,
        currency="inr",
        package_type=package_id,
        payment_status="pending",
        metadata=metadata
    )
    
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.payment_transactions.insert_one(trans_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction['payment_status'] == "paid":
        return transaction
    
    backend_url = os.environ.get('BACKEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001'))
    webhook_url = f"{backend_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    if status.payment_status == "paid" and transaction['payment_status'] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "payment_id": session_id}}
        )
        
        # Create visit package
        package = PAYMENT_PACKAGES[transaction['package_type']]
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
        if transaction['package_type'] == "property_lock" and transaction['metadata'].get('property_id'):
            lock = PropertyLock(
                customer_id=transaction['user_id'],
                property_id=transaction['metadata']['property_id']
            )
            lock_doc = lock.model_dump()
            lock_doc['created_at'] = lock_doc['created_at'].isoformat()
            await db.property_locks.insert_one(lock_doc)
        
        transaction['payment_status'] = "paid"
    
    return transaction

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    backend_url = os.environ.get('BACKEND_URL', str(request.base_url).rstrip('/'))
    webhook_url = f"{backend_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        return {"status": "success", "event_type": webhook_response.event_type}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Visit booking endpoints
@api_router.post("/visits/book")
async def book_visit(booking_data: VisitBookingCreate, current_user: dict = Depends(get_current_user)):
    # Check if user has available visits using aggregation
    num_properties = len(booking_data.property_ids)
    
    pipeline = [
        {
            "$match": {
                "customer_id": current_user['id'],
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
        total_earnings=num_properties * 100  # ₹100 per property for rider
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.visit_bookings.insert_one(doc)
    
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
    bookings = await db.visit_bookings.find({"customer_id": current_user['id']}, {"_id": 0}).to_list(50)
    return bookings

@api_router.get("/visits/available")
async def get_available_visits(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Only show pending visits to online riders
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if not rider.get('is_online', False):
        return []  # Offline riders don't see visits
    
    visits = await db.visit_bookings.find({"status": "pending", "rider_id": None}, {"_id": 0}).limit(20).to_list(None)
    
    # Enrich with property details
    for visit in visits:
        properties = []
        for prop_id in visit.get('property_ids', []):
            prop = await db.properties.find_one({"id": prop_id}, {"_id": 0, "exact_address": 0})
            if prop:
                properties.append(prop)
        visit['properties'] = properties
    
    return visits

@api_router.post("/visits/{visit_id}/accept")
async def accept_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    # Check if rider is online
    rider = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if not rider.get('is_online', False):
        raise HTTPException(status_code=400, detail="You must be online to accept visits")
    
    result = await db.visit_bookings.update_one(
        {"id": visit_id, "status": "pending"},
        {"$set": {
            "rider_id": current_user['id'], 
            "status": "rider_assigned",
            "current_step": "go_to_customer"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Visit not available")
    
    # Return visit with ALL property details including exact location
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    
    # Get customer details
    customer = await db.users.find_one({"id": visit['customer_id']}, {"_id": 0, "password": 0})
    
    # Get all properties with FULL details including exact address
    properties = []
    for prop_id in visit.get('property_ids', []):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if prop:
            properties.append(prop)
    
    return {
        "visit": visit, 
        "properties": properties,
        "customer": customer
    }

@api_router.post("/visits/{visit_id}/update-step")
async def update_visit_step(visit_id: str, step_data: VisitStepUpdate, current_user: dict = Depends(get_current_user)):
    """Update visit progress step by step (Uber Eats style navigation)"""
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    visit = await db.visit_bookings.find_one({"id": visit_id, "rider_id": current_user['id']}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found or not assigned to you")
    
    update_data = {}
    action = step_data.action
    
    if action == "start_pickup":
        update_data["current_step"] = "go_to_customer"
        update_data["status"] = "pickup_started"
        update_data["visit_start_time"] = datetime.now(timezone.utc).isoformat()
    
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
        else:
            # All properties done
            update_data["current_step"] = "completed"
            update_data["status"] = "completed"
            update_data["visit_end_time"] = datetime.now(timezone.utc).isoformat()
    
    elif action == "complete_visit":
        update_data["current_step"] = "completed"
        update_data["status"] = "completed"
        update_data["visit_end_time"] = datetime.now(timezone.utc).isoformat()
    
    await db.visit_bookings.update_one({"id": visit_id}, {"$set": update_data})
    
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

@api_router.get("/rider/active-visit")
async def get_active_visit(current_user: dict = Depends(get_current_user)):
    """Get rider's currently active visit"""
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
    
    return {
        "visit": visit,
        "properties": properties,
        "customer": customer
    }

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
    
    # Get user details for each conversation
    for conv in conversations:
        user = await db.users.find_one({"id": conv['_id']}, {"_id": 0, "password": 0})
        conv['user'] = user
        conv['other_user_id'] = conv.pop('_id')
    
    return conversations


# File upload endpoints
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    file_url = f"/uploads/{file_name}"
    return {"url": file_url, "filename": file_name}

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    file_url = f"/uploads/{file_name}"
    return {"url": file_url, "filename": file_name}

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

app.include_router(api_router)

# Mount uploads directory for serving files
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()