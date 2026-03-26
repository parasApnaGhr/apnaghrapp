from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-secret-key-2024')
JWT_ALGORITHM = 'HS256'

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    password: Optional[str] = None
    role: str
    city: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: str
    city: Optional[str] = None

class LoginRequest(BaseModel):
    phone: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class Rider(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    city: str
    vehicle_type: str = "bike"
    on_duty: bool = False
    duty_start_time: Optional[datetime] = None
    km_today: float = 0.0
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    last_location_update: Optional[datetime] = None

class RiderCreate(BaseModel):
    user_id: str
    city: str
    vehicle_type: str = "bike"

class DutyToggle(BaseModel):
    on_duty: bool
    lat: Optional[float] = None
    lng: Optional[float] = None

class LocationUpdate(BaseModel):
    lat: float
    lng: float

class SiteVisit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    property_address: str
    property_type: str
    scheduled_time: Optional[str] = None
    assigned_rider_id: Optional[str] = None
    status: str = "pending"
    feedback: Optional[str] = None
    city: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class SiteVisitCreate(BaseModel):
    client_name: str
    property_address: str
    property_type: str
    scheduled_time: Optional[str] = None
    assigned_rider_id: Optional[str] = None
    city: str

class SiteVisitUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None

class ToLetBoard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rider_id: str
    photo_url: str
    owner_phone: str
    address: str
    rent_expected: float
    property_type: str
    city: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ToLetBoardCreate(BaseModel):
    rider_id: str
    photo_url: str
    owner_phone: str
    address: str
    rent_expected: float
    property_type: str
    city: str

class BrokerVisit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rider_id: str
    broker_name: str
    office_location: str
    phone_number: str
    interest_level: str
    package_sold: bool = False
    city: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrokerVisitCreate(BaseModel):
    rider_id: str
    broker_name: str
    office_location: str
    phone_number: str
    interest_level: str
    package_sold: bool = False
    city: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str

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

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/riders", response_model=Rider)
async def create_rider(rider_data: RiderCreate, current_user: dict = Depends(get_current_user)):
    rider_obj = Rider(**rider_data.model_dump())
    doc = rider_obj.model_dump()
    await db.riders.insert_one(doc)
    return rider_obj

@api_router.get("/riders", response_model=List[Rider])
async def get_riders(city: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"city": city} if city else {}
    riders = await db.riders.find(query, {"_id": 0}).to_list(1000)
    return riders

@api_router.get("/riders/{rider_id}", response_model=Rider)
async def get_rider(rider_id: str, current_user: dict = Depends(get_current_user)):
    rider = await db.riders.find_one({"id": rider_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    return rider

@api_router.post("/riders/{rider_id}/duty")
async def toggle_duty(rider_id: str, duty_data: DutyToggle, current_user: dict = Depends(get_current_user)):
    update_data = {"on_duty": duty_data.on_duty}
    
    if duty_data.on_duty:
        update_data["duty_start_time"] = datetime.now(timezone.utc).isoformat()
        if duty_data.lat and duty_data.lng:
            update_data["current_lat"] = duty_data.lat
            update_data["current_lng"] = duty_data.lng
            update_data["last_location_update"] = datetime.now(timezone.utc).isoformat()
    else:
        update_data["duty_start_time"] = None
        update_data["km_today"] = 0.0
    
    await db.riders.update_one({"id": rider_id}, {"$set": update_data})
    return {"success": True, "on_duty": duty_data.on_duty}

@api_router.post("/riders/{rider_id}/location")
async def update_location(rider_id: str, location: LocationUpdate, current_user: dict = Depends(get_current_user)):
    rider = await db.riders.find_one({"id": rider_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    update_data = {
        "current_lat": location.lat,
        "current_lng": location.lng,
        "last_location_update": datetime.now(timezone.utc).isoformat()
    }
    
    await db.riders.update_one({"id": rider_id}, {"$set": update_data})
    return {"success": True}

@api_router.get("/riders/{rider_id}/stats")
async def get_rider_stats(rider_id: str, current_user: dict = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    boards_count = await db.tolet_boards.count_documents({"rider_id": rider_id, "created_at": {"$gte": today_start.isoformat()}})
    broker_count = await db.broker_visits.count_documents({"rider_id": rider_id, "created_at": {"$gte": today_start.isoformat()}})
    visits_count = await db.site_visits.count_documents({"assigned_rider_id": rider_id, "created_at": {"$gte": today_start.isoformat()}})
    
    return {
        "boards_today": boards_count,
        "brokers_today": broker_count,
        "visits_today": visits_count,
        "target_boards": 70,
        "target_brokers": 10,
        "target_visits": 5
    }

@api_router.post("/site-visits", response_model=SiteVisit)
async def create_site_visit(visit_data: SiteVisitCreate, current_user: dict = Depends(get_current_user)):
    visit_obj = SiteVisit(**visit_data.model_dump())
    doc = visit_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.site_visits.insert_one(doc)
    
    if visit_data.assigned_rider_id:
        rider = await db.riders.find_one({"id": visit_data.assigned_rider_id}, {"_id": 0})
        if rider:
            notif = NotificationCreate(
                user_id=rider['user_id'],
                title="New Site Visit Assigned",
                message=f"Visit scheduled for {visit_data.client_name} at {visit_data.property_address}",
                type="site_visit"
            )
            notif_obj = Notification(**notif.model_dump())
            notif_doc = notif_obj.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
    
    return visit_obj

@api_router.get("/site-visits", response_model=List[SiteVisit])
async def get_site_visits(city: Optional[str] = None, rider_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if city:
        query["city"] = city
    if rider_id:
        query["assigned_rider_id"] = rider_id
    
    visits = await db.site_visits.find(query, {"_id": 0}).to_list(1000)
    return visits

@api_router.patch("/site-visits/{visit_id}", response_model=SiteVisit)
async def update_site_visit(visit_id: str, update_data: SiteVisitUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_data.status == "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_visits.update_one({"id": visit_id}, {"$set": update_dict})
    visit = await db.site_visits.find_one({"id": visit_id}, {"_id": 0})
    return visit

@api_router.post("/tolet-boards", response_model=ToLetBoard)
async def create_tolet_board(board_data: ToLetBoardCreate, current_user: dict = Depends(get_current_user)):
    board_obj = ToLetBoard(**board_data.model_dump())
    doc = board_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tolet_boards.insert_one(doc)
    return board_obj

@api_router.get("/tolet-boards", response_model=List[ToLetBoard])
async def get_tolet_boards(city: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"city": city} if city else {}
    boards = await db.tolet_boards.find(query, {"_id": 0}).to_list(1000)
    return boards

@api_router.post("/broker-visits", response_model=BrokerVisit)
async def create_broker_visit(visit_data: BrokerVisitCreate, current_user: dict = Depends(get_current_user)):
    visit_obj = BrokerVisit(**visit_data.model_dump())
    doc = visit_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.broker_visits.insert_one(doc)
    return visit_obj

@api_router.get("/broker-visits", response_model=List[BrokerVisit])
async def get_broker_visits(city: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"city": city} if city else {}
    visits = await db.broker_visits.find(query, {"_id": 0}).to_list(1000)
    return visits

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find({"user_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifs

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return {"success": True}

@api_router.get("/dashboard/admin")
async def admin_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cities = await db.riders.distinct("city")
    city_stats = []
    
    for city in cities:
        riders_count = await db.riders.count_documents({"city": city})
        boards_count = await db.tolet_boards.count_documents({"city": city})
        brokers_count = await db.broker_visits.count_documents({"city": city})
        visits_count = await db.site_visits.count_documents({"city": city})
        
        city_stats.append({
            "city": city,
            "riders": riders_count,
            "boards": boards_count,
            "brokers": brokers_count,
            "visits": visits_count
        })
    
    return {"cities": city_stats}

@api_router.get("/dashboard/city-manager")
async def city_manager_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'city_manager':
        raise HTTPException(status_code=403, detail="City manager access required")
    
    city = current_user.get('city')
    if not city:
        raise HTTPException(status_code=400, detail="City not assigned")
    
    pipeline = [
        {"$match": {"city": city}},
        {"$limit": 100},
        {"$lookup": {
            "from": "tolet_boards",
            "localField": "id",
            "foreignField": "rider_id",
            "as": "boards"
        }},
        {"$lookup": {
            "from": "broker_visits",
            "localField": "id",
            "foreignField": "rider_id",
            "as": "brokers"
        }},
        {"$lookup": {
            "from": "site_visits",
            "localField": "id",
            "foreignField": "assigned_rider_id",
            "as": "visits"
        }},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user_data"
        }},
        {"$addFields": {
            "boards_count": {"$size": "$boards"},
            "brokers_count": {"$size": "$brokers"},
            "visits_count": {"$size": "$visits"},
            "user_name": {"$arrayElemAt": ["$user_data.name", 0]}
        }},
        {"$project": {
            "rider": "$user_name",
            "rider_id": "$id",
            "boards_found": "$boards_count",
            "brokers_visited": "$brokers_count",
            "visits": "$visits_count",
            "on_duty": 1
        }}
    ]
    
    rider_stats = await db.riders.aggregate(pipeline).to_list(None)
    
    for stat in rider_stats:
        stat.pop('_id', None)
    
    return {"city": city, "riders": rider_stats}

@api_router.get("/leaderboard")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$limit": 100},
        {"$lookup": {
            "from": "tolet_boards",
            "localField": "id",
            "foreignField": "rider_id",
            "as": "boards"
        }},
        {"$lookup": {
            "from": "broker_visits",
            "localField": "id",
            "foreignField": "rider_id",
            "as": "brokers"
        }},
        {"$lookup": {
            "from": "broker_visits",
            "let": {"rider_id": "$id"},
            "pipeline": [
                {"$match": {
                    "$expr": {
                        "$and": [
                            {"$eq": ["$rider_id", "$$rider_id"]},
                            {"$eq": ["$package_sold", True]}
                        ]
                    }
                }}
            ],
            "as": "packages"
        }},
        {"$lookup": {
            "from": "site_visits",
            "localField": "id",
            "foreignField": "assigned_rider_id",
            "as": "visits"
        }},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user_data"
        }},
        {"$addFields": {
            "boards_count": {"$size": "$boards"},
            "brokers_count": {"$size": "$brokers"},
            "visits_count": {"$size": "$visits"},
            "packages_count": {"$size": "$packages"},
            "user_name": {"$arrayElemAt": ["$user_data.name", 0]}
        }},
        {"$addFields": {
            "score": {
                "$add": [
                    {"$multiply": ["$boards_count", 1]},
                    {"$multiply": ["$brokers_count", 2]},
                    {"$multiply": ["$visits_count", 3]},
                    {"$multiply": ["$packages_count", 10]}
                ]
            }
        }},
        {"$sort": {"score": -1}},
        {"$project": {
            "rider_id": "$id",
            "name": "$user_name",
            "city": 1,
            "score": 1,
            "boards": "$boards_count",
            "brokers": "$brokers_count",
            "visits": "$visits_count",
            "packages_sold": "$packages_count"
        }}
    ]
    
    leaderboard = await db.riders.aggregate(pipeline).to_list(None)
    
    for entry in leaderboard:
        entry.pop('_id', None)
    
    return leaderboard

app.include_router(api_router)

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