"""
Customer Routes Module
Handles: Customer profile, wallet, payments, notifications
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import jwt
import os

router = APIRouter()
security = HTTPBearer()

# Database reference (set from server.py)
db = None
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

def set_database(database):
    global db
    db = database

# ============ AUTH HELPER ============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
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

# ============ MODELS ============

class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

# ============ HELPER FUNCTIONS ============

def sanitize_mongo_doc(doc):
    """Remove MongoDB ObjectId and ensure JSON serializable"""
    if isinstance(doc, list):
        return [sanitize_mongo_doc(d) for d in doc]
    if isinstance(doc, dict):
        return {k: sanitize_mongo_doc(v) for k, v in doc.items() if k != '_id'}
    return doc

# ============ PROFILE ROUTES ============

@router.put("/profile")
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

# ============ WALLET ROUTES ============

@router.get("/wallet")
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
    
    # Count properties viewed
    properties_viewed = await db.visit_bookings.count_documents({
        "$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}]
    })
    
    # Get visit packages/credits
    packages = await db.visit_packages.find(
        {"$or": [{"customer_id": current_user['id']}, {"user_id": current_user['id']}]},
        {"_id": 0}
    ).to_list(20)
    
    # Calculate available visits from valid packages
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

@router.get("/payments")
async def get_customer_payment_history(current_user: dict = Depends(get_current_user)):
    """Get customer payment history"""
    payments = await db.payment_transactions.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(None)
    
    return sanitize_mongo_doc(payments)

# ============ NOTIFICATIONS ============

@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(None)
    
    unread_count = await db.notifications.count_documents({"user_id": current_user['id'], "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@router.post("/notifications/mark-read")
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
