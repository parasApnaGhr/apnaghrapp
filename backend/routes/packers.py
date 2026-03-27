# Packers & Movers Routes
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import jwt

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'
security = HTTPBearer()


class ShiftingBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    package_tier: str
    from_address: str
    to_address: str
    from_city: str
    to_city: str
    scheduled_date: str
    contact_phone: str
    items_description: str = None
    add_ons: List[str] = []
    estimated_price: float = 0.0
    final_price: float = None
    status: str = "pending"
    assigned_vendor: str = None
    notes: str = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ShiftingBookingCreate(BaseModel):
    package_tier: str
    from_address: str
    to_address: str
    from_city: str
    to_city: str
    scheduled_date: str
    contact_phone: str
    items_description: str = None
    add_ons: List[str] = []


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

router = APIRouter(prefix="/packers", tags=["packers"])

# Pre-defined shifting packages
SHIFTING_PACKAGES = [
    {
        "id": "basic",
        "name": "BASIC SHIFT",
        "tier": "basic",
        "price_min": 2999,
        "price_max": 6999,
        "includes": ["Loading + Unloading", "Transport (mini truck)", "Basic labour"],
        "not_included": ["Packing material", "Fragile handling"],
        "best_for": ["Students", "Bachelors", "1RK / minimal items"],
        "bonus": [],
        "icon": "package",
        "color": "green"
    },
    {
        "id": "standard",
        "name": "STANDARD SHIFT",
        "tier": "standard",
        "price_min": 5999,
        "price_max": 12999,
        "includes": ["Packing (basic material)", "Loading + unloading", "Transport", "Bed & furniture handling"],
        "not_included": [],
        "best_for": ["1BHK / 2BHK families"],
        "bonus": ["1-2 labour extra"],
        "icon": "truck",
        "color": "blue"
    },
    {
        "id": "premium",
        "name": "PREMIUM SHIFT",
        "tier": "premium",
        "price_min": 10999,
        "price_max": 20999,
        "includes": ["High-quality packing", "Fragile item protection", "Furniture dismantling + assembly", "Loading + unloading", "Transport (bigger truck)"],
        "not_included": [],
        "best_for": ["2BHK / 3BHK"],
        "bonus": ["Priority service", "Faster shifting"],
        "icon": "shield",
        "color": "yellow"
    },
    {
        "id": "elite",
        "name": "ELITE SHIFT",
        "tier": "elite",
        "price_min": 18999,
        "price_max": 35000,
        "includes": ["Premium packing (bubble + foam)", "Electronics safety", "Full dismantling & setup", "Dedicated supervisor", "Insurance (basic coverage)"],
        "not_included": [],
        "best_for": ["3BHK / Villas", "High-value items"],
        "bonus": ["White glove service", "Real-time tracking"],
        "icon": "crown",
        "color": "red"
    },
    {
        "id": "intercity",
        "name": "INTERCITY SHIFT",
        "tier": "intercity",
        "price_min": 15000,
        "price_max": 60000,
        "includes": ["Full packing", "Long-distance transport", "Tracking support", "Optional insurance"],
        "not_included": [],
        "best_for": ["City to City moves"],
        "bonus": ["Car transport available", "Bike transport available"],
        "icon": "map-pin",
        "color": "purple"
    }
]

ADD_ONS = [
    {"id": "extra_packing", "name": "Extra Packing Material", "price_min": 500, "price_max": 2000},
    {"id": "insurance", "name": "Full Insurance", "price_percent": 2},
    {"id": "cleaning", "name": "Deep Cleaning", "price_min": 1000, "price_max": 3000},
    {"id": "furniture_setup", "name": "Furniture Assembly", "price_min": 500, "price_max": 1500},
    {"id": "ac_service", "name": "AC Uninstall/Install", "price_min": 1500, "price_max": 3000}
]


@router.get("/packages")
async def get_shifting_packages():
    """Get all available shifting packages"""
    return {"packages": SHIFTING_PACKAGES, "add_ons": ADD_ONS}


@router.get("/packages/{tier}")
async def get_package_by_tier(tier: str):
    """Get specific package details"""
    package = next((p for p in SHIFTING_PACKAGES if p["tier"] == tier), None)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.post("/book")
async def book_shifting(booking_data: ShiftingBookingCreate, current_user: dict = Depends(get_current_user)):
    """Book a shifting service"""
    # Validate package
    package = next((p for p in SHIFTING_PACKAGES if p["tier"] == booking_data.package_tier), None)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package tier")
    
    # Calculate estimated price (average of min/max)
    estimated_price = (package["price_min"] + package["price_max"]) / 2
    
    # Add add-on prices
    for addon_id in booking_data.add_ons:
        addon = next((a for a in ADD_ONS if a["id"] == addon_id), None)
        if addon:
            if "price_min" in addon:
                estimated_price += (addon["price_min"] + addon["price_max"]) / 2
    
    booking = ShiftingBooking(
        customer_id=current_user['id'],
        package_tier=booking_data.package_tier,
        from_address=booking_data.from_address,
        to_address=booking_data.to_address,
        from_city=booking_data.from_city,
        to_city=booking_data.to_city,
        scheduled_date=booking_data.scheduled_date,
        contact_phone=booking_data.contact_phone,
        items_description=booking_data.items_description,
        add_ons=booking_data.add_ons,
        estimated_price=estimated_price,
        status="pending"
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.shifting_bookings.insert_one(doc)
    doc.pop('_id', None)
    
    return {"message": "Booking created successfully", "booking": doc}


@router.get("/my-bookings")
async def get_my_shifting_bookings(current_user: dict = Depends(get_current_user)):
    """Get user's shifting bookings"""
    bookings = await db.shifting_bookings.find(
        {"customer_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return bookings


@router.get("/booking/{booking_id}")
async def get_shifting_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific booking details"""
    booking = await db.shifting_bookings.find_one(
        {"id": booking_id, "customer_id": current_user['id']},
        {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/booking/{booking_id}/cancel")
async def cancel_shifting_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a shifting booking"""
    result = await db.shifting_bookings.update_one(
        {"id": booking_id, "customer_id": current_user['id'], "status": "pending"},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")
    return {"message": "Booking cancelled"}


# Admin routes for managing shifting bookings
@router.get("/admin/bookings")
async def get_all_shifting_bookings(current_user: dict = Depends(get_current_user)):
    """Admin: Get all shifting bookings"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.shifting_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings


@router.post("/admin/booking/{booking_id}/confirm")
async def confirm_shifting_booking(booking_id: str, final_price: float, current_user: dict = Depends(get_current_user)):
    """Admin: Confirm booking with final price"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.shifting_bookings.update_one(
        {"id": booking_id, "status": "pending"},
        {"$set": {"status": "confirmed", "final_price": final_price}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot confirm this booking")
    return {"message": "Booking confirmed"}


@router.post("/admin/booking/{booking_id}/complete")
async def complete_shifting_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Admin: Mark booking as completed"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.shifting_bookings.update_one(
        {"id": booking_id, "status": {"$in": ["confirmed", "in_progress"]}},
        {"$set": {"status": "completed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot complete this booking")
    return {"message": "Booking completed"}
