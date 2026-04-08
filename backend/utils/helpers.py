"""
Utility functions for ApnaGhr Visit Platform
Common helpers used across the application
"""
import math
import bcrypt
import jwt
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

# ============ PASSWORD UTILITIES ============

def hash_password(password: str) -> str:
    """Hash password with bcrypt (10 rounds for performance)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# ============ JWT UTILITIES ============

def create_jwt_token(user_id: str, role: str) -> str:
    """Create JWT token with 30-day expiry"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode JWT token, returns None if invalid"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# ============ DISTANCE UTILITIES ============

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# ============ DATE/TIME UTILITIES ============

def get_ist_now() -> datetime:
    """Get current time in IST"""
    from datetime import timezone, timedelta
    IST = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(IST)

def format_ist_datetime(dt: datetime) -> str:
    """Format datetime to IST string"""
    if dt is None:
        return None
    IST = timezone(timedelta(hours=5, minutes=30))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime('%Y-%m-%d %H:%M:%S')

def get_today_date_str() -> str:
    """Get today's date in YYYY-MM-DD format (IST)"""
    return get_ist_now().strftime('%Y-%m-%d')

# ============ MONGO UTILITIES ============

def sanitize_mongo_doc(doc):
    """Remove MongoDB ObjectId and ensure JSON serializable"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [sanitize_mongo_doc(d) for d in doc]
    if isinstance(doc, dict):
        return {k: sanitize_mongo_doc(v) for k, v in doc.items() if k != '_id'}
    return doc

def prepare_for_insert(doc: dict) -> dict:
    """Prepare document for MongoDB insert (remove _id if exists)"""
    return {k: v for k, v in doc.items() if k != '_id'}

# ============ VALIDATION UTILITIES ============

def is_valid_phone(phone: str) -> bool:
    """Validate Indian phone number (10 digits)"""
    if not phone:
        return False
    phone = phone.strip().replace(' ', '').replace('-', '')
    return len(phone) == 10 and phone.isdigit()

def is_valid_email(email: str) -> bool:
    """Basic email validation"""
    import re
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# ============ STRING UTILITIES ============

def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

def generate_uuid() -> str:
    """Generate UUID string"""
    import uuid
    return str(uuid.uuid4())

def mask_phone(phone: str) -> str:
    """Mask phone number for display (e.g., ******1234)"""
    if not phone or len(phone) < 4:
        return phone
    return '*' * (len(phone) - 4) + phone[-4:]

def mask_email(email: str) -> str:
    """Mask email for display (e.g., a***@domain.com)"""
    if not email or '@' not in email:
        return email
    parts = email.split('@')
    return parts[0][:1] + '***@' + parts[1]
