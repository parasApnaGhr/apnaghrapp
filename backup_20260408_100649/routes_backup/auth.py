"""
Authentication routes module
Handles: login, register, password reset, OTP verification, terms acceptance
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import random
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

# ============ MODELS ============

class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str

class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    role: str
    is_online: bool = False
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    last_location_update: Optional[datetime] = None
    created_at: datetime

class LoginRequest(BaseModel):
    phone: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class TermsAcceptanceRequest(BaseModel):
    accepted_terms: bool = True
    accepted_privacy: bool = True
    accepted_anti_circumvention: bool = True

class ForgotPasswordRequest(BaseModel):
    phone: str
    method: str = "sms"

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ============ HELPERS ============

def hash_password(password: str) -> str:
    """Hash password with bcrypt (10 rounds for performance)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    """Create JWT token with 30-day expiry"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

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

# ============ ROUTES ============

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"phone": user_data.phone}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    import uuid
    hashed_pw = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_pw
    user_dict['id'] = str(uuid.uuid4())
    user_dict['is_online'] = False
    user_dict['current_lat'] = None
    user_dict['current_lng'] = None
    user_dict['last_location_update'] = None
    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict.copy())
    
    return UserResponse(
        id=user_dict['id'],
        name=user_dict['name'],
        phone=user_dict['phone'],
        email=user_dict.get('email'),
        role=user_dict['role'],
        is_online=False,
        current_lat=None,
        current_lng=None,
        last_location_update=None,
        created_at=datetime.now(timezone.utc)
    )

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login with phone and password"""
    user = await db.users.find_one({"phone": login_data.phone}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['role'])
    user.pop('password', None)
    
    # Include terms acceptance status
    user['terms_accepted'] = user.get('terms_accepted', False)
    user['terms_accepted_date'] = user.get('terms_accepted_date', None)
    
    return {"token": token, "user": user}

@router.post("/accept-terms")
async def accept_terms(request: TermsAcceptanceRequest, current_user: dict = Depends(get_current_user)):
    """Accept terms and conditions"""
    if not all([request.accepted_terms, request.accepted_privacy, request.accepted_anti_circumvention]):
        raise HTTPException(status_code=400, detail="All terms must be accepted")
    
    result = await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "terms_accepted": True,
            "terms_accepted_date": datetime.now(timezone.utc).isoformat(),
            "terms_version": "1.0",
            "accepted_terms": True,
            "accepted_privacy": True,
            "accepted_anti_circumvention": True
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "status": "success",
        "message": "Terms and conditions accepted successfully",
        "terms_accepted": True,
        "terms_accepted_date": datetime.now(timezone.utc).isoformat()
    }

@router.get("/terms-status")
async def get_terms_status(current_user: dict = Depends(get_current_user)):
    """Check if user has accepted terms"""
    user = await db.users.find_one(
        {"id": current_user['id']}, 
        {"_id": 0, "terms_accepted": 1, "terms_accepted_date": 1, "terms_version": 1}
    )
    
    return {
        "terms_accepted": user.get('terms_accepted', False) if user else False,
        "terms_accepted_date": user.get('terms_accepted_date', None) if user else None,
        "terms_version": user.get('terms_version', None) if user else None
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset OTP"""
    from services.notification_service import send_sms_otp, send_email_otp
    
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    if not user:
        return {"message": "If this account exists, an OTP has been sent", "method": request.method}
    
    # Generate 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP with 10 min expiry
    otp_doc = {
        "phone": request.phone,
        "otp": otp,
        "method": request.method,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "used": False
    }
    
    await db.password_reset_otps.delete_many({"phone": request.phone})
    await db.password_reset_otps.insert_one(otp_doc)
    
    response_data = {
        "message": "OTP sent successfully",
        "method": request.method,
        "expires_in_minutes": 10
    }
    
    if request.method == "email":
        if not user.get('email'):
            raise HTTPException(status_code=400, detail="No email address registered. Please use SMS.")
        
        result = await send_email_otp(
            email=user['email'],
            otp=otp,
            user_name=user.get('name', 'User')
        )
        response_data["email_masked"] = user['email'][:3] + "***" + user['email'][user['email'].find('@'):]
        
        if result.get('otp_for_testing'):
            response_data["otp_for_testing"] = result['otp_for_testing']
            response_data["dev_mode"] = True
    else:
        result = await send_sms_otp(phone=request.phone, otp=otp)
        
        if result.get('otp_for_testing'):
            response_data["otp_for_testing"] = result['otp_for_testing']
            response_data["dev_mode"] = True
    
    return response_data

@router.get("/notification-status")
async def notification_status():
    """Check SMS/Email service status"""
    from services.notification_service import get_notification_status
    return get_notification_status()

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP before password reset"""
    otp_doc = await db.password_reset_otps.find_one({
        "phone": request.phone,
        "otp": request.otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    reset_token = secrets.token_urlsafe(32)
    
    await db.password_reset_tokens.delete_many({"phone": request.phone})
    await db.password_reset_tokens.insert_one({
        "phone": request.phone,
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    })
    
    return {"valid": True, "reset_token": reset_token, "message": "OTP verified. You can now reset your password."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password after OTP verification"""
    otp_doc = await db.password_reset_otps.find_one({
        "phone": request.phone,
        "otp": request.otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    hashed_pw = hash_password(request.new_password)
    result = await db.users.update_one(
        {"phone": request.phone},
        {"$set": {"password": hashed_pw}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.password_reset_otps.update_one(
        {"phone": request.phone, "otp": request.otp},
        {"$set": {"used": True}}
    )
    
    await db.password_reset_tokens.delete_many({"phone": request.phone})
    
    return {"message": "Password reset successfully. You can now login with your new password."}

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change password for logged-in user"""
    user = await db.users.find_one({"id": current_user['id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not bcrypt.checkpw(request.current_password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hashed = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"password": new_hashed}}
    )
    
    return {"success": True, "message": "Password changed successfully"}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    current_user.pop('password', None)
    return current_user
