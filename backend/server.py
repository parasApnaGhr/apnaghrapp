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
    "single_visit": {"amount": 200.0, "visits": 1, "validity_days": 1},
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
    property_id: str
    package_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    status: str = "pending"
    rider_id: Optional[str] = None
    otp: Optional[str] = None
    visit_proof_selfie: Optional[str] = None
    visit_proof_video: Optional[str] = None
    visit_start_time: Optional[datetime] = None
    visit_end_time: Optional[datetime] = None
    customer_feedback: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitBookingCreate(BaseModel):
    property_id: str
    package_id: Optional[str] = None
    scheduled_date: str
    scheduled_time: str

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
    except Exception as e:
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
        raise HTTPException(status_code=400, detail="No available visit credits")
    
    package = packages[0]
    
    # Generate OTP
    otp = str(uuid.uuid4().int)[:6]
    
    booking = VisitBooking(
        customer_id=current_user['id'],
        property_id=booking_data.property_id,
        package_id=package['id'],
        scheduled_date=booking_data.scheduled_date,
        scheduled_time=booking_data.scheduled_time,
        status="pending",
        otp=otp
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.visit_bookings.insert_one(doc)
    
    # Increment package usage
    await db.visit_packages.update_one(
        {"id": package['id']},
        {"$inc": {"visits_used": 1}}
    )
    
    return booking

@api_router.get("/visits/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.visit_bookings.find({"customer_id": current_user['id']}, {"_id": 0}).to_list(50)
    return bookings

@api_router.get("/visits/available")
async def get_available_visits(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    visits = await db.visit_bookings.find({"status": "pending", "rider_id": None}, {"_id": 0}).limit(20).to_list(None)
    return visits

@api_router.post("/visits/{visit_id}/accept")
async def accept_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'rider':
        raise HTTPException(status_code=403, detail="Riders only")
    
    result = await db.visit_bookings.update_one(
        {"id": visit_id, "status": "pending"},
        {"$set": {"rider_id": current_user['id'], "status": "rider_assigned"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Visit not available")
    
    # Return property details with exact location
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    property_data = await db.properties.find_one({"id": visit['property_id']}, {"_id": 0})
    
    return {"visit": visit, "property": property_data}

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