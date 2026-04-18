import certifi
"""
Seller Client Verification System
Tracks referred clients, enforces 24-hour verification, and manages account locks
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import jwt
import os
import uuid

router = APIRouter()
security = HTTPBearer()

# Get environment variables
MONGO_URL = os.environ.get('MONGO_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client[os.environ.get('DB_NAME', 'apnaghr_visit_db')]

# Constants
VERIFICATION_HOURS = 24  # Hours after which verification is required
CLOSED_LOST_LIMIT = 10  # Max closed lost in a week before account lock
LOCK_PERIOD_DAYS = 7  # Rolling 7 days for counting closed lost


# Pydantic models
class ClientReferral(BaseModel):
    client_name: str
    client_phone: str
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    notes: Optional[str] = None

class VerifyClientRequest(BaseModel):
    referral_id: str
    status: str  # "closed_won", "closed_lost", "in_progress"
    notes: Optional[str] = None  # Required for in_progress


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


# ============ CHECK IF SELLER ACCOUNT IS LOCKED ============

async def check_seller_locked(seller_id: str) -> dict:
    """Check if seller account is locked"""
    lock_record = await db.seller_account_locks.find_one(
        {"seller_id": seller_id, "is_locked": True},
        {"_id": 0}
    )
    if lock_record:
        return {
            "is_locked": True,
            "locked_at": lock_record.get("locked_at"),
            "reason": lock_record.get("reason"),
            "closed_lost_count": lock_record.get("closed_lost_count")
        }
    return {"is_locked": False}


async def check_and_lock_seller(seller_id: str) -> bool:
    """Check if seller should be locked based on closed_lost count"""
    # Count closed_lost in last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=LOCK_PERIOD_DAYS)
    
    closed_lost_count = await db.seller_client_referrals.count_documents({
        "seller_id": seller_id,
        "verification_status": "closed_lost",
        "verified_at": {"$gte": week_ago}
    })
    
    if closed_lost_count >= CLOSED_LOST_LIMIT:
        # Lock the account
        await db.seller_account_locks.update_one(
            {"seller_id": seller_id},
            {"$set": {
                "seller_id": seller_id,
                "is_locked": True,
                "locked_at": datetime.now(timezone.utc),
                "reason": f"Exceeded {CLOSED_LOST_LIMIT} closed lost clients in a week",
                "closed_lost_count": closed_lost_count,
                "unlocked_by": None,
                "unlocked_at": None
            }},
            upsert=True
        )
        return True
    return False


# ============ GET PENDING VERIFICATIONS ============

@router.get("/pending-verifications")
async def get_pending_verifications(current_user: dict = Depends(get_current_user)):
    """Get all referrals that need verification (older than 24 hours)"""
    
    if current_user.get('role') != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    # Check if account is locked
    lock_status = await check_seller_locked(current_user['id'])
    if lock_status["is_locked"]:
        raise HTTPException(
            status_code=423,
            detail={
                "message": "Account locked",
                "reason": lock_status.get("reason"),
                "locked_at": lock_status.get("locked_at").isoformat() if lock_status.get("locked_at") else None
            }
        )
    
    # Get referrals older than 24 hours that haven't been verified
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=VERIFICATION_HOURS)
    
    pending = await db.seller_client_referrals.find({
        "seller_id": current_user['id'],
        "verification_status": "pending",
        "referred_at": {"$lte": cutoff_time}
    }, {"_id": 0}).sort("referred_at", 1).to_list(100)
    
    # Also get today's referrals (not yet due for verification)
    today_referrals = await db.seller_client_referrals.find({
        "seller_id": current_user['id'],
        "verification_status": "pending",
        "referred_at": {"$gt": cutoff_time}
    }, {"_id": 0}).sort("referred_at", -1).to_list(50)
    
    return {
        "pending_verifications": pending,
        "pending_count": len(pending),
        "today_referrals": today_referrals,
        "share_locked": len(pending) > 0,
        "message": f"You have {len(pending)} client(s) waiting for verification" if pending else None
    }


@router.get("/check-share-lock")
async def check_share_lock(current_user: dict = Depends(get_current_user)):
    """Quick check if share is locked for seller"""
    
    if current_user.get('role') != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    # Check if account is locked
    lock_status = await check_seller_locked(current_user['id'])
    if lock_status["is_locked"]:
        return {
            "share_locked": True,
            "account_locked": True,
            "reason": "Account locked due to too many closed lost clients",
            "locked_at": lock_status.get("locked_at").isoformat() if lock_status.get("locked_at") else None
        }
    
    # Check for pending verifications
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=VERIFICATION_HOURS)
    
    pending_count = await db.seller_client_referrals.count_documents({
        "seller_id": current_user['id'],
        "verification_status": "pending",
        "referred_at": {"$lte": cutoff_time}
    })
    
    return {
        "share_locked": pending_count > 0,
        "account_locked": False,
        "pending_count": pending_count,
        "reason": f"Verify {pending_count} pending client(s) to unlock sharing" if pending_count > 0 else None
    }


# ============ TRACK CLIENT REFERRAL ============

@router.post("/track-referral")
async def track_client_referral(referral: ClientReferral, current_user: dict = Depends(get_current_user)):
    """Track when seller refers a client/property"""
    
    if current_user.get('role') != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    # Check if account is locked
    lock_status = await check_seller_locked(current_user['id'])
    if lock_status["is_locked"]:
        raise HTTPException(
            status_code=423,
            detail="Account locked. Contact admin to unlock."
        )
    
    # Check if share is locked due to pending verifications
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=VERIFICATION_HOURS)
    pending_count = await db.seller_client_referrals.count_documents({
        "seller_id": current_user['id'],
        "verification_status": "pending",
        "referred_at": {"$lte": cutoff_time}
    })
    
    if pending_count > 0:
        raise HTTPException(
            status_code=423,
            detail=f"Share locked. Please verify {pending_count} pending client(s) first."
        )
    
    referral_record = {
        "id": str(uuid.uuid4()),
        "seller_id": current_user['id'],
        "seller_name": current_user.get('name'),
        "client_name": referral.client_name,
        "client_phone": referral.client_phone,
        "property_id": referral.property_id,
        "property_title": referral.property_title,
        "notes": referral.notes,
        "referred_at": datetime.now(timezone.utc),
        "verification_status": "pending",  # pending, closed_won, closed_lost, in_progress
        "verification_notes": None,
        "verified_at": None,
        "verification_due_at": datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_HOURS)
    }
    
    await db.seller_client_referrals.insert_one(referral_record)
    
    return {
        "success": True,
        "referral_id": referral_record['id'],
        "message": "Client referral tracked",
        "verification_due_at": referral_record['verification_due_at'].isoformat()
    }


# ============ VERIFY CLIENT ============

@router.post("/verify-client")
async def verify_client(request: VerifyClientRequest, current_user: dict = Depends(get_current_user)):
    """Verify a client referral status"""
    
    if current_user.get('role') != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    valid_statuses = ["closed_won", "closed_lost", "in_progress"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # If in_progress, notes are required
    if request.status == "in_progress" and not request.notes:
        raise HTTPException(status_code=400, detail="Please provide notes for 'Still in Progress' status")
    
    # Find the referral
    referral = await db.seller_client_referrals.find_one({
        "id": request.referral_id,
        "seller_id": current_user['id']
    })
    
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    # Update the referral
    await db.seller_client_referrals.update_one(
        {"id": request.referral_id},
        {"$set": {
            "verification_status": request.status,
            "verification_notes": request.notes,
            "verified_at": datetime.now(timezone.utc)
        }}
    )
    
    # Check if seller should be locked after this verification
    if request.status == "closed_lost":
        was_locked = await check_and_lock_seller(current_user['id'])
        if was_locked:
            return {
                "success": True,
                "message": "Verification saved. WARNING: Your account has been locked due to exceeding closed lost limit.",
                "account_locked": True
            }
    
    # Get remaining pending count
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=VERIFICATION_HOURS)
    remaining_count = await db.seller_client_referrals.count_documents({
        "seller_id": current_user['id'],
        "verification_status": "pending",
        "referred_at": {"$lte": cutoff_time}
    })
    
    return {
        "success": True,
        "message": "Verification saved",
        "remaining_pending": remaining_count,
        "share_unlocked": remaining_count == 0
    }


# ============ GET VERIFICATION HISTORY ============

@router.get("/verification-history")
async def get_verification_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get verification history for seller"""
    
    if current_user.get('role') != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    history = await db.seller_client_referrals.find({
        "seller_id": current_user['id'],
        "referred_at": {"$gte": start_date}
    }, {"_id": 0}).sort("referred_at", -1).to_list(100)
    
    # Count by status
    stats = {
        "total": len(history),
        "pending": sum(1 for h in history if h.get("verification_status") == "pending"),
        "closed_won": sum(1 for h in history if h.get("verification_status") == "closed_won"),
        "closed_lost": sum(1 for h in history if h.get("verification_status") == "closed_lost"),
        "in_progress": sum(1 for h in history if h.get("verification_status") == "in_progress")
    }
    
    return {
        "history": history,
        "stats": stats,
        "period_days": days
    }


# ============ ADMIN: UNLOCK SELLER ACCOUNT ============

@router.post("/admin/unlock-seller/{seller_id}")
async def admin_unlock_seller(seller_id: str, current_user: dict = Depends(get_current_user)):
    """Admin unlocks a seller account"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if account is actually locked
    lock_record = await db.seller_account_locks.find_one(
        {"seller_id": seller_id, "is_locked": True}
    )
    
    if not lock_record:
        raise HTTPException(status_code=404, detail="No locked account found for this seller")
    
    # Unlock the account
    await db.seller_account_locks.update_one(
        {"seller_id": seller_id},
        {"$set": {
            "is_locked": False,
            "unlocked_by": current_user['id'],
            "unlocked_at": datetime.now(timezone.utc)
        }}
    )
    
    # Get seller info
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "name": 1, "phone": 1})
    
    return {
        "success": True,
        "message": f"Account unlocked for {seller.get('name', 'Unknown')}",
        "seller_id": seller_id
    }


# ============ ADMIN: GET LOCKED SELLERS ============

@router.get("/admin/locked-sellers")
async def get_locked_sellers(current_user: dict = Depends(get_current_user)):
    """Get all locked seller accounts"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    locked = await db.seller_account_locks.find(
        {"is_locked": True},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with seller info
    for lock in locked:
        seller = await db.users.find_one({"id": lock['seller_id']}, {"_id": 0, "name": 1, "phone": 1})
        if seller:
            lock['seller_name'] = seller.get('name')
            lock['seller_phone'] = seller.get('phone')
    
    return {"locked_sellers": locked, "count": len(locked)}


# ============ ADMIN: GET SELLER VERIFICATION STATS ============

@router.get("/admin/seller-verification-stats")
async def get_seller_verification_stats(current_user: dict = Depends(get_current_user)):
    """Get verification stats for all sellers"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Aggregate stats by seller
    pipeline = [
        {"$match": {"referred_at": {"$gte": week_ago}}},
        {"$group": {
            "_id": "$seller_id",
            "total": {"$sum": 1},
            "pending": {"$sum": {"$cond": [{"$eq": ["$verification_status", "pending"]}, 1, 0]}},
            "closed_won": {"$sum": {"$cond": [{"$eq": ["$verification_status", "closed_won"]}, 1, 0]}},
            "closed_lost": {"$sum": {"$cond": [{"$eq": ["$verification_status", "closed_lost"]}, 1, 0]}},
            "in_progress": {"$sum": {"$cond": [{"$eq": ["$verification_status", "in_progress"]}, 1, 0]}}
        }},
        {"$sort": {"closed_lost": -1}}
    ]
    
    stats = await db.seller_client_referrals.aggregate(pipeline).to_list(100)
    
    # Enrich with seller info and lock status
    for stat in stats:
        seller = await db.users.find_one({"id": stat['_id']}, {"_id": 0, "name": 1, "phone": 1})
        if seller:
            stat['seller_name'] = seller.get('name')
            stat['seller_phone'] = seller.get('phone')
        
        lock_status = await check_seller_locked(stat['_id'])
        stat['is_locked'] = lock_status['is_locked']
        stat['seller_id'] = stat.pop('_id')
    
    return {"sellers": stats}
