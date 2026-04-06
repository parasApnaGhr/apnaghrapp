"""
Inventory Access Control and Tracking System
Handles access-type selection, key verification, and inventory user tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import jwt
import os
import uuid

router = APIRouter()
security = HTTPBearer()

# Get environment variables
MONGO_URL = os.environ.get('MONGO_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

# Access Keys (stored securely)
ADMIN_ACCESS_KEY = "0219"
INVENTORY_ACCESS_KEY = "inventory2024"  # Can be changed by admin

# Predefined inventory users (can be managed by admin)
PREDEFINED_INVENTORY_USERS = [
    "Rahul Sharma",
    "Priya Patel",
    "Amit Kumar",
    "Neha Singh",
    "Vikash Gupta",
    "Anjali Verma",
    "Deepak Yadav",
    "Pooja Kumari",
    "Raj Malhotra",
    "Sunita Devi"
]

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'apnaghr_visit_db')]

# Pydantic models
class VerifyKeyRequest(BaseModel):
    access_type: str  # "admin" or "inventory"
    key: str

class InventoryUserLoginRequest(BaseModel):
    name: str
    photo_base64: Optional[str] = None
    selected_cities: List[str]
    city_targets: dict  # {"city_name": target_count}

class InventoryLogoutRequest(BaseModel):
    session_id: str

class DailyWorkPlanRequest(BaseModel):
    session_id: str
    selected_cities: List[str]
    city_targets: dict

# Auth helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============ ACCESS KEY VERIFICATION ============

@router.post("/verify-key")
async def verify_access_key(request: VerifyKeyRequest, current_user: dict = Depends(get_current_user)):
    """Verify admin or inventory access key"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if request.access_type == "admin":
        if request.key == ADMIN_ACCESS_KEY:
            return {"success": True, "access_type": "admin", "message": "Full admin access granted"}
        else:
            raise HTTPException(status_code=401, detail="Invalid admin key")
    
    elif request.access_type == "inventory":
        # Check from DB first (for custom key), then fallback to default
        settings = await db.app_settings.find_one({"key": "inventory_access_key"}, {"_id": 0})
        inventory_key = settings.get("value") if settings else INVENTORY_ACCESS_KEY
        
        if request.key == inventory_key:
            return {"success": True, "access_type": "inventory", "message": "Inventory access granted"}
        else:
            raise HTTPException(status_code=401, detail="Invalid inventory key")
    
    else:
        raise HTTPException(status_code=400, detail="Invalid access type")


# ============ PREDEFINED USERS MANAGEMENT ============

@router.get("/predefined-users")
async def get_predefined_users(current_user: dict = Depends(get_current_user)):
    """Get list of predefined inventory users"""
    # Check for custom list in DB
    custom_users = await db.app_settings.find_one({"key": "inventory_users_list"}, {"_id": 0})
    if custom_users and custom_users.get("value"):
        return {"users": custom_users["value"]}
    return {"users": PREDEFINED_INVENTORY_USERS}


@router.post("/predefined-users")
async def update_predefined_users(users: List[str], current_user: dict = Depends(get_current_user)):
    """Update predefined inventory users list (admin only)"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.app_settings.update_one(
        {"key": "inventory_users_list"},
        {"$set": {"key": "inventory_users_list", "value": users, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"success": True, "message": "Inventory users list updated"}


# ============ INVENTORY USER SESSION MANAGEMENT ============

@router.post("/inventory-login")
async def inventory_user_login(request: InventoryUserLoginRequest, current_user: dict = Depends(get_current_user)):
    """Start an inventory user session with tracking"""
    
    # Validate user name against predefined list
    custom_users = await db.app_settings.find_one({"key": "inventory_users_list"}, {"_id": 0})
    valid_users = custom_users.get("value") if custom_users else PREDEFINED_INVENTORY_USERS
    
    if request.name not in valid_users:
        raise HTTPException(status_code=400, detail="Invalid user. Please select from the predefined user list.")
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Create session record
    session = {
        "session_id": session_id,
        "admin_user_id": current_user['id'],  # The admin account being used
        "inventory_user_name": request.name,
        "photo_base64": request.photo_base64[:500] if request.photo_base64 else None,  # Store truncated for efficiency
        "photo_full": request.photo_base64,  # Store full photo separately
        "login_time": datetime.now(timezone.utc),
        "logout_time": None,
        "total_active_minutes": 0,
        "selected_cities": request.selected_cities,
        "city_targets": request.city_targets,
        "total_target": sum(request.city_targets.values()) if request.city_targets else 0,
        "properties_added": 0,
        "properties_added_by_city": {},
        "points_earned": 0,
        "performance_status": "In Progress",
        "is_active": True,
        "date": datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.inventory_sessions.insert_one(session)
    
    return {
        "success": True,
        "session_id": session_id,
        "message": f"Welcome {request.name}! Session started.",
        "login_time": session["login_time"].isoformat(),
        "selected_cities": request.selected_cities,
        "total_target": session["total_target"]
    }


@router.post("/inventory-logout")
async def inventory_user_logout(request: InventoryLogoutRequest, current_user: dict = Depends(get_current_user)):
    """End an inventory user session"""
    
    session = await db.inventory_sessions.find_one({"session_id": request.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.get("is_active"):
        raise HTTPException(status_code=400, detail="Session already ended")
    
    logout_time = datetime.now(timezone.utc)
    login_time = session["login_time"]
    
    # Handle timezone-aware datetime comparison
    if login_time.tzinfo is None:
        login_time = login_time.replace(tzinfo=timezone.utc)
    
    total_minutes = (logout_time - login_time).total_seconds() / 60
    
    # Calculate performance status
    properties_added = session.get("properties_added", 0)
    performance_status = "Good Performance" if properties_added >= 30 else "Needs Attention"
    
    await db.inventory_sessions.update_one(
        {"session_id": request.session_id},
        {"$set": {
            "logout_time": logout_time,
            "total_active_minutes": round(total_minutes, 2),
            "is_active": False,
            "performance_status": performance_status
        }}
    )
    
    return {
        "success": True,
        "message": "Session ended successfully",
        "logout_time": logout_time.isoformat(),
        "total_active_minutes": round(total_minutes, 2),
        "properties_added": properties_added,
        "points_earned": properties_added,  # 1 property = 1 point
        "performance_status": performance_status
    }


# ============ PROPERTY TRACKING FOR INVENTORY USERS ============

@router.post("/track-property-added")
async def track_property_added(session_id: str, city: str, current_user: dict = Depends(get_current_user)):
    """Track when a property is added by an inventory user"""
    
    session = await db.inventory_sessions.find_one({"session_id": session_id, "is_active": True}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Update session counts
    city_counts = session.get("properties_added_by_city", {})
    city_counts[city] = city_counts.get(city, 0) + 1
    
    new_total = session.get("properties_added", 0) + 1
    
    # Calculate performance status
    performance_status = "Good Performance" if new_total >= 30 else "Needs Attention"
    
    await db.inventory_sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "properties_added": new_total,
            "properties_added_by_city": city_counts,
            "points_earned": new_total,  # 1 property = 1 point
            "performance_status": performance_status
        }}
    )
    
    return {
        "success": True,
        "properties_added": new_total,
        "city_breakdown": city_counts,
        "points_earned": new_total,
        "performance_status": performance_status
    }


# ============ INVENTORY USER DASHBOARD DATA ============

@router.get("/my-inventory-stats")
async def get_my_inventory_stats(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get current inventory user's stats for their dashboard"""
    
    session = await db.inventory_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate target vs achieved
    total_target = session.get("total_target", 0)
    properties_added = session.get("properties_added", 0)
    achievement_percentage = (properties_added / total_target * 100) if total_target > 0 else 0
    
    # Get login time
    login_time = session.get("login_time")
    if login_time and login_time.tzinfo is None:
        login_time = login_time.replace(tzinfo=timezone.utc)
    
    current_minutes = 0
    if session.get("is_active") and login_time:
        current_minutes = (datetime.now(timezone.utc) - login_time).total_seconds() / 60
    
    return {
        "session_id": session_id,
        "user_name": session.get("inventory_user_name"),
        "login_time": session.get("login_time").isoformat() if session.get("login_time") else None,
        "current_active_minutes": round(current_minutes, 2),
        "selected_cities": session.get("selected_cities", []),
        "city_targets": session.get("city_targets", {}),
        "total_target": total_target,
        "properties_added": properties_added,
        "properties_added_by_city": session.get("properties_added_by_city", {}),
        "points_earned": properties_added,
        "achievement_percentage": round(achievement_percentage, 1),
        "performance_status": session.get("performance_status", "In Progress"),
        "is_active": session.get("is_active", False)
    }


# ============ ADMIN: INVENTORY TEAM PERFORMANCE ============

@router.get("/admin/inventory-team")
async def get_inventory_team_performance(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all inventory users' performance data for admin"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Default to today
    if not date:
        date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Get all sessions for the date
    sessions = await db.inventory_sessions.find(
        {"date": date},
        {"_id": 0, "photo_full": 0}  # Exclude large photo data
    ).sort("login_time", -1).to_list(100)
    
    # Calculate summary stats
    total_users = len(set(s.get("inventory_user_name") for s in sessions))
    total_properties = sum(s.get("properties_added", 0) for s in sessions)
    active_sessions = sum(1 for s in sessions if s.get("is_active"))
    good_performers = sum(1 for s in sessions if s.get("performance_status") == "Good Performance")
    
    return {
        "date": date,
        "summary": {
            "total_users_logged": total_users,
            "total_sessions": len(sessions),
            "active_sessions": active_sessions,
            "total_properties_added": total_properties,
            "good_performers": good_performers,
            "needs_attention": len(sessions) - good_performers - active_sessions
        },
        "sessions": sessions
    }


@router.get("/admin/inventory-user-detail/{session_id}")
async def get_inventory_user_detail(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed info for a specific inventory session (including photo)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    session = await db.inventory_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


# ============ ADMIN: UPDATE INVENTORY KEY ============

@router.post("/admin/update-inventory-key")
async def update_inventory_key(new_key: str, current_user: dict = Depends(get_current_user)):
    """Update the inventory access key (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if len(new_key) < 4:
        raise HTTPException(status_code=400, detail="Key must be at least 4 characters")
    
    await db.app_settings.update_one(
        {"key": "inventory_access_key"},
        {"$set": {"key": "inventory_access_key", "value": new_key, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"success": True, "message": "Inventory access key updated"}


# ============ GET AVAILABLE CITIES ============

@router.get("/available-cities")
async def get_available_cities(current_user: dict = Depends(get_current_user)):
    """Get list of available cities for inventory work plan"""
    
    # Get cities from properties collection
    cities = await db.properties.distinct("city")
    
    # Filter out empty values and clean up
    cities = [c for c in cities if c and c.strip()]
    
    # Get custom added cities
    custom_cities = await db.app_settings.find_one({"key": "custom_inventory_cities"}, {"_id": 0})
    if custom_cities and custom_cities.get("value"):
        cities.extend(custom_cities["value"])
    
    # Remove duplicates (case-insensitive)
    seen = set()
    unique_cities = []
    for city in cities:
        if city.lower() not in seen:
            seen.add(city.lower())
            unique_cities.append(city)
    
    # If no cities found, return default list
    if not unique_cities:
        unique_cities = [
            "Chandigarh", "Mohali", "Panchkula", "Zirakpur", "Kharar",
            "Derabassi", "Rajpura", "Lalru", "Dera Bassi", "New Chandigarh"
        ]
    
    return {"cities": sorted(unique_cities)}



# ============ ADD NEW CITY ============

class AddCityRequest(BaseModel):
    city: str

@router.post("/add-city")
async def add_city(request: AddCityRequest, current_user: dict = Depends(get_current_user)):
    """Add a new city to the available cities list"""
    
    city_name = request.city.strip()
    
    if not city_name:
        raise HTTPException(status_code=400, detail="City name cannot be empty")
    
    if len(city_name) < 2:
        raise HTTPException(status_code=400, detail="City name must be at least 2 characters")
    
    # Check if city already exists in properties
    existing_cities = await db.properties.distinct("city")
    existing_cities = [c.lower() for c in existing_cities if c]
    
    if city_name.lower() in existing_cities:
        raise HTTPException(status_code=400, detail="This city already exists")
    
    # Get or create custom cities list
    custom_cities = await db.app_settings.find_one({"key": "custom_inventory_cities"}, {"_id": 0})
    cities_list = custom_cities.get("value", []) if custom_cities else []
    
    # Check if already in custom list
    if city_name.lower() in [c.lower() for c in cities_list]:
        raise HTTPException(status_code=400, detail="This city already exists")
    
    # Add to custom cities
    cities_list.append(city_name)
    
    await db.app_settings.update_one(
        {"key": "custom_inventory_cities"},
        {"$set": {"key": "custom_inventory_cities", "value": cities_list, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"success": True, "message": f"City '{city_name}' added successfully", "city": city_name}
