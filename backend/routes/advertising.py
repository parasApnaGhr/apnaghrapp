# Advertising Routes
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
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


class Advertisement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    advertiser_id: str
    company_name: str
    package_tier: str
    poster_images: List[str] = []
    video_url: Optional[str] = None
    target_url: Optional[str] = None
    description: str
    placement: List[str] = []
    status: str = "pending"
    impressions: int = 0
    clicks: int = 0
    start_date: str
    end_date: str
    amount_paid: float = 0.0
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdvertisementCreate(BaseModel):
    company_name: str
    package_tier: str
    poster_images: List[str] = []
    video_url: Optional[str] = None
    target_url: Optional[str] = None
    description: str
    placement: List[str] = []
    start_date: str
    end_date: str


class AdvertiserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    business_type: str
    contact_email: str
    contact_phone: str
    gst_number: str = None
    address: str = None
    logo_url: str = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdvertiserProfileCreate(BaseModel):
    company_name: str
    business_type: str
    contact_email: str
    contact_phone: str
    gst_number: str = None
    address: str = None


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

router = APIRouter(prefix="/advertising", tags=["advertising"])

# Pre-defined advertising packages
ADVERTISING_PACKAGES = [
    {
        "id": "starter",
        "name": "STARTER BOOST",
        "tier": "starter",
        "price_monthly": 2999,
        "includes": ["1 poster/banner in app", "Home screen display (scroll section)", "Basic visibility"],
        "best_for": ["Local packers & movers", "Small brokers", "Furniture shops"],
        "icon": "zap",
        "color": "green",
        "posters_allowed": 1,
        "push_notifications": 0,
        "whatsapp_promotions": 0
    },
    {
        "id": "growth",
        "name": "GROWTH PACKAGE",
        "tier": "growth",
        "price_monthly": 7999,
        "includes": ["3-5 creative posters", "Home screen placement", "Property detail page placement", "WhatsApp promotion (1 time)", "Priority listing in category"],
        "best_for": ["Growing local brands"],
        "icon": "trending-up",
        "color": "blue",
        "posters_allowed": 5,
        "push_notifications": 0,
        "whatsapp_promotions": 1
    },
    {
        "id": "premium",
        "name": "PREMIUM VISIBILITY",
        "tier": "premium",
        "price_monthly": 14999,
        "includes": ["Premium banner placement (top section)", "Featured tag: Recommended by ApnaGhr", "8-10 creatives", "Weekly WhatsApp promotion", "In-app push notifications (2-3 times/month)"],
        "best_for": ["Established businesses"],
        "icon": "star",
        "color": "yellow",
        "posters_allowed": 10,
        "push_notifications": 3,
        "whatsapp_promotions": 4
    },
    {
        "id": "elite",
        "name": "ELITE BRAND PARTNER",
        "tier": "elite",
        "price_monthly": 29999,
        "includes": ["Top banner (fixed position)", "Exclusive category placement", "Unlimited creatives", "Weekly push notifications", "Dedicated promotion campaign", "Lead sharing (direct customers)"],
        "best_for": ["Big brands", "Builders", "Furniture chains"],
        "icon": "crown",
        "color": "red",
        "posters_allowed": -1,  # Unlimited
        "push_notifications": -1,  # Unlimited
        "whatsapp_promotions": 4
    }
]

ADD_ON_SERVICES = [
    {"id": "video_ad", "name": "Video Advertisement", "price_min": 2000, "price_max": 5000},
    {"id": "push_blast", "name": "Push Notification Blast", "price": 1000},
    {"id": "premium_shoot", "name": "Premium Photo/Video Shoot", "price_min": 3000, "price_max": 10000}
]


@router.get("/packages")
async def get_advertising_packages():
    """Get all available advertising packages"""
    return {"packages": ADVERTISING_PACKAGES, "add_ons": ADD_ON_SERVICES}


@router.get("/packages/{tier}")
async def get_package_by_tier(tier: str):
    """Get specific package details"""
    package = next((p for p in ADVERTISING_PACKAGES if p["tier"] == tier), None)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


# Advertiser profile management
@router.post("/profile")
async def create_advertiser_profile(profile_data: AdvertiserProfileCreate, current_user: dict = Depends(get_current_user)):
    """Create or update advertiser profile"""
    existing = await db.advertiser_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    if existing:
        # Update existing profile
        await db.advertiser_profiles.update_one(
            {"user_id": current_user['id']},
            {"$set": profile_data.model_dump()}
        )
        updated = await db.advertiser_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        return updated
    
    # Create new profile
    profile = AdvertiserProfile(
        user_id=current_user['id'],
        **profile_data.model_dump()
    )
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.advertiser_profiles.insert_one(doc)
    doc.pop('_id', None)
    
    # Update user role to include advertiser
    if current_user['role'] == 'customer':
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"role": "advertiser"}}
        )
    
    return doc


@router.get("/profile")
async def get_advertiser_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's advertiser profile"""
    profile = await db.advertiser_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Advertiser profile not found. Please create one first.")
    return profile


# Advertisement management
@router.post("/ads")
async def create_advertisement(ad_data: AdvertisementCreate, current_user: dict = Depends(get_current_user)):
    """Create a new advertisement"""
    # Check if user has advertiser profile
    profile = await db.advertiser_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=400, detail="Please create an advertiser profile first")
    
    # Validate package
    package = next((p for p in ADVERTISING_PACKAGES if p["tier"] == ad_data.package_tier), None)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package tier")
    
    ad = Advertisement(
        advertiser_id=current_user['id'],
        company_name=ad_data.company_name,
        package_tier=ad_data.package_tier,
        poster_images=ad_data.poster_images,
        video_url=ad_data.video_url,
        target_url=ad_data.target_url,
        description=ad_data.description,
        placement=ad_data.placement,
        status="pending",
        start_date=ad_data.start_date,
        end_date=ad_data.end_date,
        amount_paid=package["price_monthly"]
    )
    
    doc = ad.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.advertisements.insert_one(doc)
    doc.pop('_id', None)
    
    return {"message": "Advertisement created and pending approval", "ad": doc}


@router.get("/ads")
async def get_my_advertisements(current_user: dict = Depends(get_current_user)):
    """Get current user's advertisements"""
    ads = await db.advertisements.find(
        {"advertiser_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return ads


@router.get("/ads/{ad_id}")
async def get_advertisement(ad_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific advertisement"""
    ad = await db.advertisements.find_one(
        {"id": ad_id, "advertiser_id": current_user['id']},
        {"_id": 0}
    )
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    return ad


@router.post("/ads/{ad_id}/pause")
async def pause_advertisement(ad_id: str, current_user: dict = Depends(get_current_user)):
    """Pause an active advertisement"""
    result = await db.advertisements.update_one(
        {"id": ad_id, "advertiser_id": current_user['id'], "status": "active"},
        {"$set": {"status": "paused"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot pause this advertisement")
    return {"message": "Advertisement paused"}


# Public routes for displaying ads
@router.get("/active")
async def get_active_ads(placement: Optional[str] = None):
    """Get active advertisements for display"""
    query = {"status": "active"}
    if placement:
        query["placement"] = placement
    
    ads = await db.advertisements.find(query, {"_id": 0}).to_list(20)
    return ads


@router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str):
    """Track advertisement click"""
    await db.advertisements.update_one(
        {"id": ad_id},
        {"$inc": {"clicks": 1}}
    )
    ad = await db.advertisements.find_one({"id": ad_id}, {"_id": 0, "target_url": 1})
    return {"target_url": ad.get("target_url") if ad else None}


@router.post("/ads/{ad_id}/impression")
async def track_ad_impression(ad_id: str):
    """Track advertisement impression"""
    await db.advertisements.update_one(
        {"id": ad_id},
        {"$inc": {"impressions": 1}}
    )
    return {"success": True}


# Admin routes
@router.get("/admin/ads")
async def admin_get_all_ads(current_user: dict = Depends(get_current_user)):
    """Admin: Get all advertisements"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ads = await db.advertisements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ads


@router.post("/admin/ads/{ad_id}/approve")
async def admin_approve_ad(ad_id: str, current_user: dict = Depends(get_current_user)):
    """Admin: Approve an advertisement"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.advertisements.update_one(
        {"id": ad_id, "status": "pending"},
        {"$set": {"status": "active"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot approve this advertisement")
    return {"message": "Advertisement approved and now active"}


@router.post("/admin/ads/{ad_id}/reject")
async def admin_reject_ad(ad_id: str, reason: str, current_user: dict = Depends(get_current_user)):
    """Admin: Reject an advertisement"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.advertisements.update_one(
        {"id": ad_id, "status": "pending"},
        {"$set": {"status": "rejected", "rejection_reason": reason}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot reject this advertisement")
    return {"message": "Advertisement rejected"}


@router.get("/admin/profiles")
async def admin_get_all_profiles(current_user: dict = Depends(get_current_user)):
    """Admin: Get all advertiser profiles"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    profiles = await db.advertiser_profiles.find({}, {"_id": 0}).to_list(100)
    return profiles


@router.post("/admin/profiles/{profile_id}/verify")
async def admin_verify_profile(profile_id: str, current_user: dict = Depends(get_current_user)):
    """Admin: Verify an advertiser profile"""
    if current_user['role'] not in ['admin', 'support_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.advertiser_profiles.update_one(
        {"id": profile_id},
        {"$set": {"verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Profile not found")
    return {"message": "Profile verified"}
