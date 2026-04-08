"""
Auth Controller - Business logic for authentication
"""
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import secrets
import random

from utils.helpers import hash_password, verify_password, create_jwt_token, generate_uuid
from models.schemas import UserCreate, UserResponse, LoginRequest, LoginResponse

class AuthController:
    def __init__(self, db):
        self.db = db
    
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        existing = await self.db.users.find_one({"phone": user_data.phone}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        hashed_pw = hash_password(user_data.password)
        user_dict = user_data.model_dump()
        user_dict['password'] = hashed_pw
        user_dict['id'] = generate_uuid()
        user_dict['is_online'] = False
        user_dict['current_lat'] = None
        user_dict['current_lng'] = None
        user_dict['last_location_update'] = None
        user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        
        await self.db.users.insert_one(user_dict.copy())
        
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
    
    async def login(self, login_data: LoginRequest) -> LoginResponse:
        """Login with phone and password"""
        user = await self.db.users.find_one({"phone": login_data.phone}, {"_id": 0})
        if not user or not verify_password(login_data.password, user['password']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_jwt_token(user['id'], user['role'])
        user.pop('password', None)
        
        user['terms_accepted'] = user.get('terms_accepted', False)
        user['terms_accepted_date'] = user.get('terms_accepted_date', None)
        
        return {"token": token, "user": user}
    
    async def accept_terms(self, user_id: str) -> dict:
        """Accept terms and conditions"""
        result = await self.db.users.update_one(
            {"id": user_id},
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
    
    async def get_terms_status(self, user_id: str) -> dict:
        """Check if user has accepted terms"""
        user = await self.db.users.find_one(
            {"id": user_id}, 
            {"_id": 0, "terms_accepted": 1, "terms_accepted_date": 1, "terms_version": 1}
        )
        
        return {
            "terms_accepted": user.get('terms_accepted', False) if user else False,
            "terms_accepted_date": user.get('terms_accepted_date', None) if user else None,
            "terms_version": user.get('terms_version', None) if user else None
        }
    
    async def forgot_password(self, phone: str, method: str = "sms") -> dict:
        """Request password reset OTP"""
        from services.notification_service import send_sms_otp, send_email_otp
        
        user = await self.db.users.find_one({"phone": phone}, {"_id": 0})
        if not user:
            return {"message": "If this account exists, an OTP has been sent", "method": method}
        
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        otp_doc = {
            "phone": phone,
            "otp": otp,
            "method": method,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
            "used": False
        }
        
        await self.db.password_reset_otps.delete_many({"phone": phone})
        await self.db.password_reset_otps.insert_one(otp_doc)
        
        response_data = {
            "message": "OTP sent successfully",
            "method": method,
            "expires_in_minutes": 10
        }
        
        if method == "email":
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
            result = await send_sms_otp(phone=phone, otp=otp)
            
            if result.get('otp_for_testing'):
                response_data["otp_for_testing"] = result['otp_for_testing']
                response_data["dev_mode"] = True
        
        return response_data
    
    async def verify_otp(self, phone: str, otp: str) -> dict:
        """Verify OTP before password reset"""
        otp_doc = await self.db.password_reset_otps.find_one({
            "phone": phone,
            "otp": otp,
            "used": False
        }, {"_id": 0})
        
        if not otp_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
        reset_token = secrets.token_urlsafe(32)
        
        await self.db.password_reset_tokens.delete_many({"phone": phone})
        await self.db.password_reset_tokens.insert_one({
            "phone": phone,
            "token": reset_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        })
        
        return {"valid": True, "reset_token": reset_token, "message": "OTP verified. You can now reset your password."}
    
    async def reset_password(self, phone: str, otp: str, new_password: str) -> dict:
        """Reset password after OTP verification"""
        otp_doc = await self.db.password_reset_otps.find_one({
            "phone": phone,
            "otp": otp,
            "used": False
        }, {"_id": 0})
        
        if not otp_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        expires_at = datetime.fromisoformat(otp_doc['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        hashed_pw = hash_password(new_password)
        result = await self.db.users.update_one(
            {"phone": phone},
            {"$set": {"password": hashed_pw}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        await self.db.password_reset_otps.update_one(
            {"phone": phone, "otp": otp},
            {"$set": {"used": True}}
        )
        
        await self.db.password_reset_tokens.delete_many({"phone": phone})
        
        return {"message": "Password reset successfully. You can now login with your new password."}
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> dict:
        """Change password for logged-in user"""
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not verify_password(current_password, user['password']):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        new_hashed = hash_password(new_password)
        
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"password": new_hashed}}
        )
        
        return {"success": True, "message": "Password changed successfully"}
    
    async def get_user(self, user_id: str) -> dict:
        """Get user by ID"""
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
