"""
Seller Performance & Tracking System
- Daily login/logout tracking
- Activity reporting
- Performance scoring
- Leaderboard
- Earnings calculation
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import os
import base64

router = APIRouter(prefix="/seller-performance", tags=["seller-performance"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# JWT auth
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

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


# ============ NOTIFICATION HELPERS ============

async def send_seller_notification(seller_id: str, notification_type: str, title: str, message: str):
    """Send a notification to a seller"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": seller_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    return notification


async def check_and_notify_milestones(seller_id: str, monthly_data: dict):
    """Check for bonus milestones and send notifications"""
    total_deals = monthly_data.get('total_deals', 0)
    total_score = monthly_data.get('total_score', 0)
    
    notifications = []
    
    # Deal milestone notifications
    if total_deals == 9:
        notifications.append({
            "type": "milestone_approaching",
            "title": "🎯 Almost There!",
            "message": "You're just 1 deal away from the ₹5,000 High Performer Bonus! Keep pushing!"
        })
    elif total_deals == 10:
        notifications.append({
            "type": "milestone_reached",
            "title": "🏆 Bonus Unlocked!",
            "message": "Congratulations! You've closed 10 deals and earned ₹5,000 High Performer Bonus!"
        })
    elif total_deals == 14:
        notifications.append({
            "type": "milestone_approaching",
            "title": "🚀 Next Level Approaching!",
            "message": "1 more deal to unlock ₹10,000 bonus! You're doing amazing!"
        })
    elif total_deals == 15:
        notifications.append({
            "type": "milestone_reached",
            "title": "💎 Premium Performer!",
            "message": "WOW! 15 deals closed! You've earned ₹10,000 High Performer Bonus!"
        })
    elif total_deals == 19:
        notifications.append({
            "type": "milestone_approaching",
            "title": "🔥 Elite Status Incoming!",
            "message": "Just 1 deal away from the massive ₹20,000 bonus! Go for it!"
        })
    elif total_deals == 20:
        notifications.append({
            "type": "milestone_reached",
            "title": "👑 ELITE PERFORMER!",
            "message": "LEGENDARY! 20 deals closed! You've earned the maximum ₹20,000 High Performer Bonus!"
        })
    
    # Score milestone notifications
    if total_score >= 500 and total_score < 510:
        notifications.append({
            "type": "rank_change",
            "title": "⭐ Top Performer Status!",
            "message": "You've reached 500+ points and earned 'Top Performer' status!"
        })
    elif total_score >= 300 and total_score < 310:
        notifications.append({
            "type": "rank_change",
            "title": "📈 Performance Upgrade!",
            "message": "Great progress! You've reached 'Good' performance level with 300+ points!"
        })
    
    # Send all notifications
    for notif in notifications:
        await send_seller_notification(seller_id, notif["type"], notif["title"], notif["message"])
    
    return len(notifications)


async def send_daily_score_notification(seller_id: str, score_data: dict, rank: int = None):
    """Send notification about daily score"""
    score = score_data.get('final_score', 0)
    bonus = score_data.get('bonus', 0)
    penalty = score_data.get('penalty', 0)
    
    if score >= 100:
        title = "🌟 Great Day!"
        message = f"You scored {score} points today! "
        if bonus > 0:
            message += f"(+{bonus} bonus) "
        message += "Keep up the excellent work!"
    elif score >= 50:
        title = "💪 Good Effort!"
        message = f"You scored {score} points today. "
        if penalty > 0:
            message += f"You lost {penalty} points to penalties. "
        message += "Tomorrow, aim higher!"
    else:
        title = "📊 Daily Score Update"
        message = f"You scored {score} points today. "
        if penalty > 0:
            message += f"(-{penalty} penalty) "
        message += "Let's improve tomorrow!"
    
    if rank and rank <= 3:
        message += f" 🏅 You're ranked #{rank} today!"
    
    await send_seller_notification(seller_id, "daily_score", title, message)


async def send_rank_change_notification(seller_id: str, old_rank: int, new_rank: int, period: str = "daily"):
    """Send notification when rank changes significantly"""
    if new_rank < old_rank:
        # Improved rank
        title = "📈 Rank Up!"
        message = f"Your {period} rank improved from #{old_rank} to #{new_rank}! Great work!"
        await send_seller_notification(seller_id, "rank_change", title, message)
    elif new_rank > old_rank and (new_rank - old_rank) >= 3:
        # Dropped rank significantly
        title = "⚠️ Rank Alert"
        message = f"Your {period} rank dropped from #{old_rank} to #{new_rank}. Time to step up!"
        await send_seller_notification(seller_id, "rank_change", title, message)


# ============ COMMISSION STRUCTURE ============
COMMISSION_SLABS = [
    (10000, 14999, 500),
    (15000, 19999, 780),
    (20000, 25000, 1000),
    (25001, 30000, 1300),
    (31000, 35000, 2000),
    (35001, 40000, 2200),
    (41000, 45000, 2500),
    (46000, 49000, 2700),
    (50000, 70000, 5000),
    (71000, 100000, 8000),
    (105000, 150000, 10000),
]

def calculate_commission(rent_amount: float) -> float:
    """Calculate commission based on rent amount"""
    for min_rent, max_rent, commission in COMMISSION_SLABS:
        if min_rent <= rent_amount <= max_rent:
            return commission
    if rent_amount > 150000:
        return 10000  # Max commission
    return 0


# ============ SCORING FORMULAS ============
def calculate_daily_score(properties_shared: int, visits_booked: int, deals_closed: int, 
                          login_time: datetime = None) -> dict:
    """
    Calculate daily performance score
    Score = (Properties shared × 1) + (Visits Booked × 5) + (Deals Closed × 20)
    """
    base_score = (properties_shared * 1) + (visits_booked * 5) + (deals_closed * 20)
    
    bonus = 0
    penalty = 0
    
    # Bonuses
    if properties_shared >= 20:
        bonus += 10
    if visits_booked >= 5:
        bonus += 15
    if deals_closed >= 1:
        bonus += 25
    
    # Penalties
    if properties_shared < 20:
        penalty += 10
    
    # Late login penalty (after 11 AM)
    if login_time:
        login_hour = login_time.hour
        if login_hour >= 11:
            penalty += 10
    
    final_score = max(0, base_score + bonus - penalty)
    
    return {
        "base_score": base_score,
        "bonus": bonus,
        "penalty": penalty,
        "final_score": final_score
    }


def calculate_performance_bonus(score: int) -> float:
    """Calculate performance bonus: 100 points = ₹50"""
    return (score // 100) * 50


def calculate_high_performer_bonus(deals_closed: int) -> float:
    """Calculate high performer bonus based on deals"""
    if deals_closed >= 20:
        return 20000
    elif deals_closed >= 15:
        return 10000
    elif deals_closed >= 10:
        return 5000
    return 0


def get_performance_tag(monthly_score: int) -> str:
    """Get performance tag based on monthly score"""
    if monthly_score >= 500:
        return "Top Performer"
    elif monthly_score >= 300:
        return "Good"
    elif monthly_score >= 150:
        return "Average"
    return "Low"


# ============ MODELS ============
class DailyStartReport(BaseModel):
    image_base64: Optional[str] = None
    today_plan: str
    planned_visits: int
    expected_deals: int


class DailyEndReport(BaseModel):
    clients_called: int
    visits_booked: int
    deals_closed: int
    tomorrow_visits: int
    properties_shared: int = 0


class MotivationQuote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote: str
    author: Optional[str] = None
    is_active: bool = True
    date: Optional[str] = None  # If specific to a date
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ SELLER ENDPOINTS ============

@router.get("/check-daily-status")
async def check_daily_status(current_user: dict = Depends(get_current_user)):
    """Check if seller needs to submit daily start report"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    now = datetime.now(timezone.utc)
    
    # Check for today's activity
    activity = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": today
    }, {"_id": 0})
    
    # If no activity exists, create one immediately to track login
    if not activity:
        activity = {
            "id": str(uuid.uuid4()),
            "seller_id": current_user['id'],
            "seller_name": current_user.get('name'),
            "seller_phone": current_user.get('phone'),
            "date": today,
            "login_time": now,
            "logout_time": None,
            "start_report_submitted": False,
            "logout_report_submitted": False,
            "today_plan": None,
            "planned_visits": 0,
            "expected_deals": 0,
            "clients_called": 0,
            "properties_shared": 0,
            "visits_booked": 0,
            "deals_closed": 0,
            "tomorrow_visits_planned": 0,
            "daily_score": 0,
            "warning_flag": False,
            "created_at": now
        }
        await db.seller_daily_activity.insert_one(activity.copy())
        # Remove _id for response
        activity.pop('_id', None)
    
    # Check for pending logout report from yesterday
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    pending_logout = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": yesterday,
        "logout_time": None,
        "logout_report_submitted": {"$ne": True}
    }, {"_id": 0})
    
    # Check for warnings
    warnings = []
    last_activity = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "logout_report_submitted": True
    }, {"_id": 0}, sort=[("date", -1)])
    
    if last_activity:
        if last_activity.get('clients_called', 0) < 60:
            warnings.append("Your calls were below 60 yesterday. Increase your calling activity!")
        if last_activity.get('properties_shared', 0) < 20:
            warnings.append("You shared less than 20 properties yesterday. Share more to earn more!")
    
    # Get today's motivation quote
    quote = await db.motivation_quotes.find_one({
        "$or": [
            {"date": today},
            {"date": None, "is_active": True}
        ]
    }, {"_id": 0})
    
    return {
        "needs_start_report": not activity.get('start_report_submitted', False),
        "start_report_submitted": activity.get('start_report_submitted', False),
        "needs_pending_logout": pending_logout is not None,
        "pending_logout_date": yesterday if pending_logout else None,
        "warnings": warnings,
        "motivation_quote": quote.get('quote') if quote else "Every property shared is a step towards success!",
        "quote_author": quote.get('author') if quote else "ApnaGhr Team",
        "today_activity": activity
    }


@router.post("/daily-start")
async def submit_daily_start(
    report: DailyStartReport,
    current_user: dict = Depends(get_current_user)
):
    """Submit daily start report (mandatory after login)"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    now = datetime.now(timezone.utc)
    
    # Check if already submitted
    existing = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": today,
        "start_report_submitted": True
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Start report already submitted today")
    
    # Save image if provided
    image_url = None
    if report.image_base64:
        # In production, upload to cloud storage
        # For now, store as data URL or skip
        image_url = f"data:image/jpeg;base64,{report.image_base64[:100]}..."  # Truncate for storage
    
    activity = {
        "id": str(uuid.uuid4()),
        "seller_id": current_user['id'],
        "seller_name": current_user.get('name'),
        "date": today,
        "login_time": now,
        "logout_time": None,
        "image_url": image_url,
        "today_plan": report.today_plan,
        "planned_visits": report.planned_visits,
        "expected_deals": report.expected_deals,
        "start_report_submitted": True,
        "logout_report_submitted": False,
        # End of day fields
        "clients_called": 0,
        "visits_booked": 0,
        "deals_closed": 0,
        "properties_shared": 0,
        "tomorrow_visits": 0,
        # Scoring
        "daily_score": 0,
        "warning_flag": False,
        "created_at": now
    }
    
    await db.seller_daily_activity.insert_one(activity)
    
    # Send motivational notification
    await send_seller_notification(
        current_user['id'],
        "daily_start",
        "🌅 Day Started!",
        f"Your daily start report is submitted. You planned {report.planned_visits} visits and {report.expected_deals} deals. Go crush it!"
    )
    
    return {"success": True, "message": "Daily start report submitted", "activity_id": activity['id']}


@router.post("/daily-end")
async def submit_daily_end(
    report: DailyEndReport,
    current_user: dict = Depends(get_current_user)
):
    """Submit daily end report (mandatory before logout)"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    now = datetime.now(timezone.utc)
    
    # Find today's activity
    activity = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": today
    })
    
    if not activity:
        # Create activity if not exists (edge case)
        activity = {
            "id": str(uuid.uuid4()),
            "seller_id": current_user['id'],
            "seller_name": current_user.get('name'),
            "date": today,
            "login_time": now,
            "start_report_submitted": False
        }
        await db.seller_daily_activity.insert_one(activity)
    
    # Calculate score
    login_time = activity.get('login_time')
    score_data = calculate_daily_score(
        properties_shared=report.properties_shared,
        visits_booked=report.visits_booked,
        deals_closed=report.deals_closed,
        login_time=login_time
    )
    
    # Check for warnings
    warning_flag = report.clients_called < 60 or report.properties_shared < 20
    
    # Calculate working hours
    working_hours = 0
    if login_time:
        # Handle timezone-naive datetime from MongoDB
        if login_time.tzinfo is None:
            login_time = login_time.replace(tzinfo=timezone.utc)
        working_hours = (now - login_time).total_seconds() / 3600
    
    # Update activity
    update_data = {
        "logout_time": now,
        "clients_called": report.clients_called,
        "visits_booked": report.visits_booked,
        "deals_closed": report.deals_closed,
        "properties_shared": report.properties_shared,
        "tomorrow_visits": report.tomorrow_visits,
        "daily_score": score_data['final_score'],
        "score_breakdown": score_data,
        "warning_flag": warning_flag,
        "working_hours": round(working_hours, 2),
        "logout_report_submitted": True
    }
    
    await db.seller_daily_activity.update_one(
        {"seller_id": current_user['id'], "date": today},
        {"$set": update_data}
    )
    
    # Update monthly score
    await update_monthly_score(current_user['id'])
    
    # Get updated monthly data for milestone checks
    month = now.strftime('%Y-%m')
    monthly_data = await db.seller_monthly_performance.find_one({
        "seller_id": current_user['id'],
        "month": month
    }, {"_id": 0})
    
    # Send notifications
    # 1. Daily score notification
    await send_daily_score_notification(current_user['id'], score_data)
    
    # 2. Check for bonus milestones
    if monthly_data:
        await check_and_notify_milestones(current_user['id'], monthly_data)
    
    # 3. Warning notification if needed
    if warning_flag:
        await send_seller_notification(
            current_user['id'],
            "performance_warning",
            "⚠️ Performance Alert",
            f"Today's activity was below target. Calls: {report.clients_called}/60, Properties shared: {report.properties_shared}/20. Let's improve tomorrow!"
        )
    
    return {
        "success": True,
        "message": "Daily report submitted",
        "score": score_data,
        "warning": warning_flag
    }


@router.post("/submit-pending-logout")
async def submit_pending_logout(
    report: DailyEndReport,
    date: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit pending logout report from previous day"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    activity = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": date
    })
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Auto-set logout time to 6 PM of that day
    logout_time = datetime.strptime(date + " 18:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    
    score_data = calculate_daily_score(
        properties_shared=report.properties_shared,
        visits_booked=report.visits_booked,
        deals_closed=report.deals_closed,
        login_time=activity.get('login_time')
    )
    
    # Apply no-submission penalty
    score_data['penalty'] += 50
    score_data['final_score'] = max(0, score_data['final_score'] - 50)
    
    warning_flag = report.clients_called < 60 or report.properties_shared < 20
    
    update_data = {
        "logout_time": logout_time,
        "clients_called": report.clients_called,
        "visits_booked": report.visits_booked,
        "deals_closed": report.deals_closed,
        "properties_shared": report.properties_shared,
        "tomorrow_visits": report.tomorrow_visits,
        "daily_score": score_data['final_score'],
        "score_breakdown": score_data,
        "warning_flag": warning_flag,
        "logout_report_submitted": True,
        "late_submission": True
    }
    
    await db.seller_daily_activity.update_one(
        {"seller_id": current_user['id'], "date": date},
        {"$set": update_data}
    )
    
    await update_monthly_score(current_user['id'])
    
    return {"success": True, "message": "Pending report submitted", "score": score_data}


async def update_monthly_score(seller_id: str):
    """Update monthly score for a seller"""
    now = datetime.now(timezone.utc)
    month = now.strftime('%Y-%m')
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get all activities for this month
    activities = await db.seller_daily_activity.find({
        "seller_id": seller_id,
        "date": {"$regex": f"^{month}"}
    }, {"_id": 0}).to_list(None)
    
    total_score = sum(a.get('daily_score', 0) for a in activities)
    total_deals = sum(a.get('deals_closed', 0) for a in activities)
    total_login_days = len([a for a in activities if a.get('start_report_submitted')])
    total_properties_shared = sum(a.get('properties_shared', 0) for a in activities)
    total_visits_booked = sum(a.get('visits_booked', 0) for a in activities)
    
    # Calculate earnings
    performance_bonus = calculate_performance_bonus(total_score)
    high_performer_bonus = calculate_high_performer_bonus(total_deals)
    
    # Get commission from completed deals (from existing system)
    # This would integrate with the existing commission system
    
    earnings_data = {
        "seller_id": seller_id,
        "month": month,
        "total_login_days": total_login_days,
        "total_score": total_score,
        "total_deals": total_deals,
        "total_properties_shared": total_properties_shared,
        "total_visits_booked": total_visits_booked,
        "performance_bonus": performance_bonus,
        "high_performer_bonus": high_performer_bonus,
        "performance_tag": get_performance_tag(total_score),
        "updated_at": now
    }
    
    await db.seller_monthly_performance.update_one(
        {"seller_id": seller_id, "month": month},
        {"$set": earnings_data},
        upsert=True
    )


@router.get("/my-performance")
async def get_my_performance(current_user: dict = Depends(get_current_user)):
    """Get seller's performance data"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    now = datetime.now(timezone.utc)
    today = now.strftime('%Y-%m-%d')
    month = now.strftime('%Y-%m')
    
    # Today's activity
    today_activity = await db.seller_daily_activity.find_one({
        "seller_id": current_user['id'],
        "date": today
    }, {"_id": 0})
    
    # Monthly performance
    monthly = await db.seller_monthly_performance.find_one({
        "seller_id": current_user['id'],
        "month": month
    }, {"_id": 0})
    
    # Get rank
    all_monthly = await db.seller_monthly_performance.find({
        "month": month
    }, {"_id": 0}).sort("total_score", -1).to_list(None)
    
    rank = 1
    for i, m in enumerate(all_monthly):
        if m['seller_id'] == current_user['id']:
            rank = i + 1
            break
    
    # Calculate earnings prediction
    current_deals = monthly.get('total_deals', 0) if monthly else 0
    current_score = monthly.get('total_score', 0) if monthly else 0
    
    # Prediction: if you close X more deals
    predictions = []
    next_milestones = [10, 15, 20]
    for milestone in next_milestones:
        if current_deals < milestone:
            deals_needed = milestone - current_deals
            bonus = calculate_high_performer_bonus(milestone)
            current_bonus = calculate_high_performer_bonus(current_deals)
            extra_earnings = bonus - current_bonus
            if extra_earnings > 0:
                predictions.append({
                    "deals_needed": deals_needed,
                    "extra_earnings": extra_earnings,
                    "message": f"Close {deals_needed} more deals to earn ₹{extra_earnings:,} bonus!"
                })
    
    return {
        "today": {
            "score": today_activity.get('daily_score', 0) if today_activity else 0,
            "properties_shared": today_activity.get('properties_shared', 0) if today_activity else 0,
            "visits_booked": today_activity.get('visits_booked', 0) if today_activity else 0,
            "deals_closed": today_activity.get('deals_closed', 0) if today_activity else 0
        },
        "monthly": {
            "score": monthly.get('total_score', 0) if monthly else 0,
            "deals": monthly.get('total_deals', 0) if monthly else 0,
            "properties_shared": monthly.get('total_properties_shared', 0) if monthly else 0,
            "visits_booked": monthly.get('total_visits_booked', 0) if monthly else 0,
            "login_days": monthly.get('total_login_days', 0) if monthly else 0,
            "performance_tag": monthly.get('performance_tag', 'Low') if monthly else 'Low',
            "performance_bonus": monthly.get('performance_bonus', 0) if monthly else 0,
            "high_performer_bonus": monthly.get('high_performer_bonus', 0) if monthly else 0
        },
        "rank": rank,
        "total_sellers": len(all_monthly),
        "predictions": predictions
    }


@router.get("/my-activity-history")
async def get_activity_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 30
):
    """Get seller's activity history"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    activities = await db.seller_daily_activity.find({
        "seller_id": current_user['id']
    }, {"_id": 0}).sort("date", -1).limit(limit).to_list(None)
    
    return activities


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/sellers-tracking")
async def admin_get_sellers_tracking(
    current_user: dict = Depends(get_current_user),
    date: Optional[str] = None
):
    """Get all sellers' tracking data for a date"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not date:
        date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    activities = await db.seller_daily_activity.find({
        "date": date
    }, {"_id": 0}).to_list(None)
    
    # Get all sellers
    sellers = await db.users.find({"role": "seller"}, {"_id": 0, "password_hash": 0}).to_list(None)
    seller_map = {s['id']: s for s in sellers}
    
    result = []
    for activity in activities:
        seller = seller_map.get(activity['seller_id'], {})
        result.append({
            **activity,
            "seller_phone": seller.get('phone'),
            "seller_email": seller.get('email')
        })
    
    # Add sellers who didn't login
    active_seller_ids = {a['seller_id'] for a in activities}
    for seller in sellers:
        if seller['id'] not in active_seller_ids:
            result.append({
                "seller_id": seller['id'],
                "seller_name": seller.get('name'),
                "seller_phone": seller.get('phone'),
                "date": date,
                "login_time": None,
                "logout_time": None,
                "no_login": True
            })
    
    return result


@router.get("/admin/seller-detail/{seller_id}")
async def admin_get_seller_detail(
    seller_id: str,
    current_user: dict = Depends(get_current_user),
    month: Optional[str] = None
):
    """Get detailed tracking for a specific seller"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not month:
        month = datetime.now(timezone.utc).strftime('%Y-%m')
    
    # Get seller info
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password_hash": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # Get monthly activities
    activities = await db.seller_daily_activity.find({
        "seller_id": seller_id,
        "date": {"$regex": f"^{month}"}
    }, {"_id": 0}).sort("date", -1).to_list(None)
    
    # Get monthly performance
    performance = await db.seller_monthly_performance.find_one({
        "seller_id": seller_id,
        "month": month
    }, {"_id": 0})
    
    # Calculate attendance stats
    total_days_in_month = 30  # Approximate
    login_days = len([a for a in activities if a.get('login_time')])
    proper_timing_days = len([a for a in activities 
        if a.get('login_time') and a.get('login_time').hour < 11])
    
    # Risk assessment
    low_score_days = len([a for a in activities if a.get('daily_score', 0) < 100])
    is_at_risk = low_score_days >= 3
    
    return {
        "seller": seller,
        "activities": activities,
        "performance": performance,
        "stats": {
            "login_days": login_days,
            "proper_timing_days": proper_timing_days,
            "attendance_percentage": round((login_days / 25) * 100, 1),  # Out of 25 required days
            "is_at_risk": is_at_risk,
            "low_score_streak": low_score_days
        }
    }


@router.get("/admin/leaderboard")
async def admin_get_leaderboard(
    current_user: dict = Depends(get_current_user),
    period: str = "monthly"  # daily or monthly
):
    """Get seller leaderboard"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        today = now.strftime('%Y-%m-%d')
        activities = await db.seller_daily_activity.find({
            "date": today,
            "logout_report_submitted": True
        }, {"_id": 0}).sort("daily_score", -1).to_list(None)
        
        leaderboard = []
        for i, a in enumerate(activities):
            leaderboard.append({
                "rank": i + 1,
                "seller_id": a['seller_id'],
                "seller_name": a.get('seller_name'),
                "score": a.get('daily_score', 0),
                "deals": a.get('deals_closed', 0),
                "properties_shared": a.get('properties_shared', 0),
                "visits_booked": a.get('visits_booked', 0)
            })
        return {"period": "daily", "date": today, "leaderboard": leaderboard}
    
    else:  # monthly
        month = now.strftime('%Y-%m')
        performances = await db.seller_monthly_performance.find({
            "month": month
        }, {"_id": 0}).sort("total_score", -1).to_list(None)
        
        # Get seller names
        seller_ids = [p['seller_id'] for p in performances]
        sellers = await db.users.find({"id": {"$in": seller_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(None)
        seller_map = {s['id']: s.get('name') for s in sellers}
        
        leaderboard = []
        for i, p in enumerate(performances):
            leaderboard.append({
                "rank": i + 1,
                "seller_id": p['seller_id'],
                "seller_name": seller_map.get(p['seller_id'], 'Unknown'),
                "score": p.get('total_score', 0),
                "deals": p.get('total_deals', 0),
                "properties_shared": p.get('total_properties_shared', 0),
                "visits_booked": p.get('total_visits_booked', 0),
                "login_days": p.get('total_login_days', 0),
                "performance_tag": p.get('performance_tag', 'Low'),
                "performance_bonus": p.get('performance_bonus', 0),
                "high_performer_bonus": p.get('high_performer_bonus', 0)
            })
        return {"period": "monthly", "month": month, "leaderboard": leaderboard}


@router.get("/admin/earnings")
async def admin_get_earnings(
    current_user: dict = Depends(get_current_user),
    month: Optional[str] = None
):
    """Get all sellers' earnings for payout"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not month:
        month = datetime.now(timezone.utc).strftime('%Y-%m')
    
    # Get all monthly performances
    performances = await db.seller_monthly_performance.find({
        "month": month
    }, {"_id": 0}).to_list(None)
    
    # Get payout status
    payouts = await db.seller_payouts.find({
        "month": month
    }, {"_id": 0}).to_list(None)
    payout_map = {p['seller_id']: p for p in payouts}
    
    # Get seller info
    seller_ids = [p['seller_id'] for p in performances]
    sellers = await db.users.find({"id": {"$in": seller_ids}}, {"_id": 0, "password_hash": 0}).to_list(None)
    seller_map = {s['id']: s for s in sellers}
    
    result = []
    for perf in performances:
        seller = seller_map.get(perf['seller_id'], {})
        payout = payout_map.get(perf['seller_id'], {})
        
        # Calculate total earnings (performance bonus + high performer bonus)
        # Commission is handled separately in existing system
        total_bonus = perf.get('performance_bonus', 0) + perf.get('high_performer_bonus', 0)
        
        result.append({
            "seller_id": perf['seller_id'],
            "seller_name": seller.get('name'),
            "seller_phone": seller.get('phone'),
            "month": month,
            "total_score": perf.get('total_score', 0),
            "total_deals": perf.get('total_deals', 0),
            "login_days": perf.get('total_login_days', 0),
            "performance_bonus": perf.get('performance_bonus', 0),
            "high_performer_bonus": perf.get('high_performer_bonus', 0),
            "total_bonus": total_bonus,
            "payout_status": payout.get('status', 'pending'),
            "payout_date": payout.get('payout_date')
        })
    
    return result


@router.post("/admin/mark-paid")
async def admin_mark_paid(
    seller_ids: List[str],
    month: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark sellers as paid"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    for seller_id in seller_ids:
        await db.seller_payouts.update_one(
            {"seller_id": seller_id, "month": month},
            {"$set": {
                "seller_id": seller_id,
                "month": month,
                "status": "paid",
                "payout_date": now,
                "marked_by": current_user['id']
            }},
            upsert=True
        )
    
    return {"success": True, "marked": len(seller_ids)}


# ============ MOTIVATION QUOTES (ADMIN) ============

@router.post("/admin/motivation-quote")
async def admin_add_quote(
    quote: str,
    author: Optional[str] = None,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Add motivation quote"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    quote_doc = MotivationQuote(
        quote=quote,
        author=author,
        date=date
    )
    
    await db.motivation_quotes.insert_one(quote_doc.dict())
    return {"success": True, "quote_id": quote_doc.id}


@router.get("/admin/motivation-quotes")
async def admin_get_quotes(current_user: dict = Depends(get_current_user)):
    """Get all motivation quotes"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    quotes = await db.motivation_quotes.find({}, {"_id": 0}).to_list(None)
    return quotes


@router.delete("/admin/motivation-quote/{quote_id}")
async def admin_delete_quote(quote_id: str, current_user: dict = Depends(get_current_user)):
    """Delete motivation quote"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.motivation_quotes.delete_one({"id": quote_id})
    return {"success": True}


# ============ CRON JOB ENDPOINTS ============

@router.post("/cron/auto-logout")
async def cron_auto_logout():
    """Auto-submit logout reports at midnight for sellers who didn't logout"""
    # This should be called by a cron job at midnight
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Find activities without logout
    pending = await db.seller_daily_activity.find({
        "date": yesterday,
        "logout_report_submitted": {"$ne": True}
    }, {"_id": 0}).to_list(None)
    
    for activity in pending:
        # Auto-submit with zeros and apply penalty
        logout_time = datetime.strptime(yesterday + " 18:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        
        score_data = calculate_daily_score(0, 0, 0, activity.get('login_time'))
        score_data['penalty'] += 50  # No logout penalty
        score_data['final_score'] = max(0, score_data['final_score'] - 50)
        
        await db.seller_daily_activity.update_one(
            {"id": activity['id']},
            {"$set": {
                "logout_time": logout_time,
                "clients_called": 0,
                "visits_booked": 0,
                "deals_closed": 0,
                "properties_shared": 0,
                "tomorrow_visits": 0,
                "daily_score": score_data['final_score'],
                "score_breakdown": score_data,
                "warning_flag": True,
                "logout_report_submitted": True,
                "auto_submitted": True
            }}
        )
        
        await update_monthly_score(activity['seller_id'])
    
    return {"success": True, "processed": len(pending)}
