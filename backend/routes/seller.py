"""
Seller (Calling Agent) Module Routes
Handles seller registration, referral tracking, commission management, and client tracking
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid
import random
import string
import os

router = APIRouter(prefix="/seller", tags=["Seller"])

# Commission structure based on brokerage amount
COMMISSION_STRUCTURE = [
    {"min": 10000, "max": 14999, "commission": 500},
    {"min": 15000, "max": 19999, "commission": 780},
    {"min": 20000, "max": 25000, "commission": 1000},
    {"min": 25001, "max": 30000, "commission": 1300},
    {"min": 31000, "max": 35000, "commission": 2000},
    {"min": 35001, "max": 40000, "commission": 2200},
    {"min": 41000, "max": 45000, "commission": 2500},
    {"min": 46000, "max": 49000, "commission": 2700},
    {"min": 50000, "max": 70000, "commission": 5000},
    {"min": 71000, "max": 100000, "commission": 8000},
    {"min": 105000, "max": 150000, "commission": 10000},
]

def calculate_commission(brokerage_amount: float) -> float:
    """Calculate seller commission based on brokerage amount"""
    for tier in COMMISSION_STRUCTURE:
        if tier["min"] <= brokerage_amount <= tier["max"]:
            return tier["commission"]
    # For amounts above 1.5L, use 10000
    if brokerage_amount > 150000:
        return 10000
    return 0

def generate_referral_code(length=8):
    """Generate unique referral code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# Pydantic Models
class SellerRegistration(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    city: str
    experience_years: Optional[int] = 0

class SellerApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

class SharePropertyRequest(BaseModel):
    property_id: str
    client_name: Optional[str] = None
    client_phone: Optional[str] = None

class SellerChatMessage(BaseModel):
    visit_id: str
    message: str

class DealClosureRequest(BaseModel):
    visit_id: str
    brokerage_amount: float
    notes: Optional[str] = None

class SellerWallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    total_earnings: float = 0.0
    pending_earnings: float = 0.0
    approved_earnings: float = 0.0
    paid_earnings: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SellerReferral(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    referral_code: str
    property_id: str
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    visit_id: Optional[str] = None
    status: str = "shared"  # shared, registered, booked, visited, deal_closed
    brokerage_amount: Optional[float] = None
    commission_amount: Optional[float] = None
    commission_status: str = "pending"  # pending, approved, paid
    share_url: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    converted_at: Optional[datetime] = None
    deal_closed_at: Optional[datetime] = None

class SellerCommission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    referral_id: str
    visit_id: str
    client_id: str
    property_id: str
    brokerage_amount: float
    commission_amount: float
    status: str = "pending"  # pending, approved, paid
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def setup_seller_routes(api_router, db, get_current_user, bcrypt_module):
    """Setup all seller routes with database dependency"""
    
    @api_router.post("/seller/register")
    async def register_seller(data: SellerRegistration):
        """Register as a new seller (pending admin approval)"""
        # Check if phone already exists
        existing = await db.users.find_one({"phone": data.phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        # Generate unique referral code
        referral_code = generate_referral_code()
        while await db.users.find_one({"referral_code": referral_code}):
            referral_code = generate_referral_code()
        
        # Hash password
        hashed = bcrypt_module.hashpw(data.password.encode('utf-8'), bcrypt_module.gensalt())
        
        # Create seller user with pending approval
        seller = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "phone": data.phone,
            "email": data.email,
            "password": hashed.decode('utf-8'),
            "role": "seller",
            "referral_code": referral_code,
            "city": data.city,
            "experience_years": data.experience_years,
            "approval_status": "pending",  # pending, approved, rejected
            "approved_by": None,
            "approved_at": None,
            "rejection_reason": None,
            "is_active": False,
            "total_referrals": 0,
            "successful_deals": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(seller)
        
        # Create seller wallet
        wallet = {
            "id": str(uuid.uuid4()),
            "seller_id": seller["id"],
            "total_earnings": 0.0,
            "pending_earnings": 0.0,
            "approved_earnings": 0.0,
            "paid_earnings": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.seller_wallets.insert_one(wallet)
        
        return {
            "success": True,
            "message": "Registration submitted! Your account will be activated after admin approval.",
            "referral_code": referral_code
        }
    
    @api_router.get("/seller/dashboard")
    async def get_seller_dashboard(current_user: dict = Depends(get_current_user)):
        """Get seller dashboard with stats"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        if current_user.get('approval_status') != 'approved':
            raise HTTPException(status_code=403, detail="Account not yet approved")
        
        seller_id = current_user['id']
        
        # Get referral stats
        total_referrals = await db.seller_referrals.count_documents({"seller_id": seller_id})
        converted_referrals = await db.seller_referrals.count_documents({
            "seller_id": seller_id,
            "status": {"$in": ["booked", "visited", "deal_closed"]}
        })
        closed_deals = await db.seller_referrals.count_documents({
            "seller_id": seller_id,
            "status": "deal_closed"
        })
        
        # Get wallet
        wallet = await db.seller_wallets.find_one({"seller_id": seller_id}, {"_id": 0})
        
        # Get recent referrals
        recent_referrals = await db.seller_referrals.find(
            {"seller_id": seller_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        # Get active visits (clients currently on visits)
        active_visits = await db.visit_bookings.find({
            "referred_by": seller_id,
            "status": {"$in": ["rider_assigned", "pickup_started", "at_customer", "navigating", "at_property"]}
        }, {"_id": 0}).to_list(20)
        
        return {
            "stats": {
                "total_referrals": total_referrals,
                "converted_referrals": converted_referrals,
                "closed_deals": closed_deals,
                "conversion_rate": round((converted_referrals / total_referrals * 100) if total_referrals > 0 else 0, 1)
            },
            "wallet": wallet,
            "recent_referrals": recent_referrals,
            "active_visits": active_visits,
            "referral_code": current_user.get('referral_code')
        }
    
    @api_router.get("/seller/properties")
    async def get_available_properties(
        city: Optional[str] = None,
        min_rent: Optional[int] = None,
        max_rent: Optional[int] = None,
        bhk: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Get available properties for seller to share with clients"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        if current_user.get('approval_status') != 'approved':
            raise HTTPException(status_code=403, detail="Account not yet approved")
        
        query = {"status": "available"}
        
        if city:
            query["city"] = {"$regex": city, "$options": "i"}
        if min_rent:
            query["rent"] = {"$gte": min_rent}
        if max_rent:
            query.setdefault("rent", {})["$lte"] = max_rent
        if bhk:
            query["bhk"] = int(bhk.replace("BHK", ""))
        
        properties = await db.properties.find(
            query,
            {"_id": 0, "exact_address": 0}
        ).sort("created_at", -1).limit(100).to_list(100)
        
        return properties
    
    @api_router.post("/seller/share-property")
    async def share_property(data: SharePropertyRequest, current_user: dict = Depends(get_current_user)):
        """Generate WhatsApp share link for a property"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        if current_user.get('approval_status') != 'approved':
            raise HTTPException(status_code=403, detail="Account not yet approved")
        
        # Get property
        property_doc = await db.properties.find_one({"id": data.property_id}, {"_id": 0})
        if not property_doc:
            raise HTTPException(status_code=404, detail="Property not found")
        
        seller_id = current_user['id']
        referral_code = current_user.get('referral_code')
        
        # Create referral record
        referral_id = str(uuid.uuid4())
        share_url = f"?ref={referral_code}&p={data.property_id}"
        
        referral = {
            "id": referral_id,
            "seller_id": seller_id,
            "referral_code": referral_code,
            "property_id": data.property_id,
            "client_name": data.client_name,
            "client_phone": data.client_phone,
            "status": "shared",
            "share_url": share_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.seller_referrals.insert_one(referral)
        
        # Update seller stats
        await db.users.update_one(
            {"id": seller_id},
            {"$inc": {"total_referrals": 1}}
        )
        
        # Generate WhatsApp message
        whatsapp_message = f"""🏠 *{property_doc['title']}*

📍 {property_doc['area_name']}, {property_doc['city']}
🛏️ {property_doc['bhk']} BHK | {property_doc['furnishing']}
💰 ₹{property_doc['rent']:,}/month

✨ Check out this amazing property on ApnaGhr!

👉 Click to view & book visit: {{APP_URL}}/customer/property/{data.property_id}{share_url}

Shared by: {current_user['name']} (ApnaGhr Partner)"""
        
        return {
            "success": True,
            "referral_id": referral_id,
            "share_url": share_url,
            "whatsapp_message": whatsapp_message,
            "property": property_doc
        }
    
    @api_router.get("/seller/referrals")
    async def get_seller_referrals(
        status: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Get all referrals by this seller"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        query = {"seller_id": current_user['id']}
        if status:
            query["status"] = status
        
        referrals = await db.seller_referrals.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(100).to_list(100)
        
        # Enrich with property and client details
        for ref in referrals:
            # Get property info
            prop = await db.properties.find_one(
                {"id": ref.get("property_id")},
                {"_id": 0, "title": 1, "area_name": 1, "city": 1, "rent": 1, "bhk": 1, "images": 1}
            )
            ref["property"] = prop
            
            # Get client info if converted
            if ref.get("client_id"):
                client = await db.users.find_one(
                    {"id": ref["client_id"]},
                    {"_id": 0, "name": 1, "phone": 1}
                )
                ref["client"] = client
        
        return referrals
    
    @api_router.get("/seller/visits")
    async def get_seller_client_visits(current_user: dict = Depends(get_current_user)):
        """Get visits made by clients referred by this seller"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        seller_id = current_user['id']
        
        # Find visits that were referred by this seller
        visits = await db.visit_bookings.find(
            {"referred_by": seller_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        # Enrich with client, rider, and property details
        for visit in visits:
            # Get customer info
            customer = await db.users.find_one(
                {"id": visit.get("customer_id")},
                {"_id": 0, "name": 1, "phone": 1}
            )
            visit["customer"] = customer
            
            # Get rider info (for tracking)
            if visit.get("rider_id"):
                rider = await db.users.find_one(
                    {"id": visit["rider_id"]},
                    {"_id": 0, "id": 1, "name": 1, "is_online": 1, "current_lat": 1, "current_lng": 1}
                )
                visit["rider"] = rider
            
            # Get properties
            if visit.get("property_ids"):
                properties = await db.properties.find(
                    {"id": {"$in": visit["property_ids"]}},
                    {"_id": 0, "id": 1, "title": 1, "area_name": 1, "city": 1, "rent": 1}
                ).to_list(10)
                visit["properties"] = properties
        
        return visits
    
    @api_router.get("/seller/visit/{visit_id}/track")
    async def track_client_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
        """Get real-time tracking info for a client's visit"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        visit = await db.visit_bookings.find_one(
            {"id": visit_id, "referred_by": current_user['id']},
            {"_id": 0}
        )
        
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found or not your referral")
        
        # Get rider location
        rider = None
        if visit.get("rider_id"):
            rider = await db.users.find_one(
                {"id": visit["rider_id"]},
                {"_id": 0, "id": 1, "name": 1, "is_online": 1, "current_lat": 1, "current_lng": 1, "last_location_update": 1}
            )
        
        # Get customer info
        customer = await db.users.find_one(
            {"id": visit["customer_id"]},
            {"_id": 0, "name": 1, "phone": 1}
        )
        
        # Get properties
        properties = await db.properties.find(
            {"id": {"$in": visit.get("property_ids", [])}},
            {"_id": 0, "id": 1, "title": 1, "area_name": 1, "latitude": 1, "longitude": 1}
        ).to_list(10)
        
        return {
            "visit": visit,
            "rider": rider,
            "customer": customer,
            "properties": properties,
            "current_step": visit.get("current_step", "waiting"),
            "current_property_index": visit.get("current_property_index", 0)
        }
    
    @api_router.post("/seller/chat/send")
    async def send_chat_to_rider(data: SellerChatMessage, current_user: dict = Depends(get_current_user)):
        """Send message to rider handling client's visit"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        # Verify visit belongs to seller's referral
        visit = await db.visit_bookings.find_one(
            {"id": data.visit_id, "referred_by": current_user['id']},
            {"_id": 0}
        )
        
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found or not your referral")
        
        if not visit.get("rider_id"):
            raise HTTPException(status_code=400, detail="No rider assigned yet")
        
        # Create chat message
        message = {
            "id": str(uuid.uuid4()),
            "sender_id": current_user['id'],
            "sender_role": "seller",
            "receiver_id": visit["rider_id"],
            "receiver_role": "rider",
            "visit_id": data.visit_id,
            "message": data.message,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.seller_rider_chats.insert_one(message)
        
        return {"success": True, "message_id": message["id"]}
    
    @api_router.get("/seller/chat/{visit_id}")
    async def get_chat_messages(visit_id: str, current_user: dict = Depends(get_current_user)):
        """Get chat messages for a visit"""
        if current_user.get('role') not in ['seller', 'rider']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Build query based on role
        if current_user.get('role') == 'seller':
            visit = await db.visit_bookings.find_one(
                {"id": visit_id, "referred_by": current_user['id']}
            )
        else:  # rider
            visit = await db.visit_bookings.find_one(
                {"id": visit_id, "rider_id": current_user['id']}
            )
        
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
        
        messages = await db.seller_rider_chats.find(
            {"visit_id": visit_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        
        # Mark messages as read
        await db.seller_rider_chats.update_many(
            {"visit_id": visit_id, "receiver_id": current_user['id'], "read": False},
            {"$set": {"read": True}}
        )
        
        return messages
    
    @api_router.get("/seller/commissions")
    async def get_seller_commissions(current_user: dict = Depends(get_current_user)):
        """Get commission history for seller"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        commissions = await db.seller_commissions.find(
            {"seller_id": current_user['id']},
            {"_id": 0}
        ).sort("created_at", -1).limit(100).to_list(100)
        
        # Enrich with property details
        for comm in commissions:
            prop = await db.properties.find_one(
                {"id": comm.get("property_id")},
                {"_id": 0, "title": 1, "area_name": 1, "city": 1}
            )
            comm["property"] = prop
        
        wallet = await db.seller_wallets.find_one(
            {"seller_id": current_user['id']},
            {"_id": 0}
        )
        
        return {
            "commissions": commissions,
            "wallet": wallet,
            "commission_structure": COMMISSION_STRUCTURE
        }
    
    @api_router.get("/seller/wallet")
    async def get_seller_wallet(current_user: dict = Depends(get_current_user)):
        """Get seller wallet details"""
        if current_user.get('role') != 'seller':
            raise HTTPException(status_code=403, detail="Seller access required")
        
        wallet = await db.seller_wallets.find_one(
            {"seller_id": current_user['id']},
            {"_id": 0}
        )
        
        if not wallet:
            # Create wallet if doesn't exist
            wallet = {
                "id": str(uuid.uuid4()),
                "seller_id": current_user['id'],
                "total_earnings": 0.0,
                "pending_earnings": 0.0,
                "approved_earnings": 0.0,
                "paid_earnings": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.seller_wallets.insert_one(wallet)
        
        return wallet
    
    # ============ ADMIN ENDPOINTS FOR SELLER MANAGEMENT ============
    
    @api_router.get("/admin/sellers")
    async def get_all_sellers(
        status: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Admin: Get all sellers"""
        if current_user.get('role') not in ['admin', 'support_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        query = {"role": "seller"}
        if status:
            query["approval_status"] = status
        
        sellers = await db.users.find(
            query,
            {"_id": 0, "password": 0}
        ).sort("created_at", -1).to_list(200)
        
        # Add stats for each seller
        for seller in sellers:
            seller["stats"] = {
                "total_referrals": await db.seller_referrals.count_documents({"seller_id": seller["id"]}),
                "converted": await db.seller_referrals.count_documents({
                    "seller_id": seller["id"],
                    "status": {"$in": ["booked", "visited", "deal_closed"]}
                }),
                "deals_closed": await db.seller_referrals.count_documents({
                    "seller_id": seller["id"],
                    "status": "deal_closed"
                })
            }
            
            # Get wallet
            wallet = await db.seller_wallets.find_one(
                {"seller_id": seller["id"]},
                {"_id": 0, "total_earnings": 1, "pending_earnings": 1}
            )
            seller["wallet"] = wallet
        
        return sellers
    
    @api_router.get("/admin/sellers/pending")
    async def get_pending_sellers(current_user: dict = Depends(get_current_user)):
        """Admin: Get sellers pending approval"""
        if current_user.get('role') not in ['admin', 'support_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        sellers = await db.users.find(
            {"role": "seller", "approval_status": "pending"},
            {"_id": 0, "password": 0}
        ).sort("created_at", -1).to_list(100)
        
        return sellers
    
    @api_router.post("/admin/sellers/{seller_id}/approve")
    async def approve_seller(seller_id: str, data: SellerApproval, current_user: dict = Depends(get_current_user)):
        """Admin: Approve or reject seller registration"""
        if current_user.get('role') not in ['admin', 'support_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        seller = await db.users.find_one({"id": seller_id, "role": "seller"})
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")
        
        if data.approved:
            await db.users.update_one(
                {"id": seller_id},
                {"$set": {
                    "approval_status": "approved",
                    "is_active": True,
                    "approved_by": current_user['id'],
                    "approved_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            return {"success": True, "message": "Seller approved successfully"}
        else:
            await db.users.update_one(
                {"id": seller_id},
                {"$set": {
                    "approval_status": "rejected",
                    "is_active": False,
                    "approved_by": current_user['id'],
                    "rejection_reason": data.rejection_reason
                }}
            )
            return {"success": True, "message": "Seller rejected"}
    
    @api_router.post("/admin/sellers/create")
    async def admin_create_seller(data: SellerRegistration, current_user: dict = Depends(get_current_user)):
        """Admin: Create seller directly (pre-approved)"""
        if current_user.get('role') not in ['admin', 'support_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if phone already exists
        existing = await db.users.find_one({"phone": data.phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        # Generate unique referral code
        referral_code = generate_referral_code()
        while await db.users.find_one({"referral_code": referral_code}):
            referral_code = generate_referral_code()
        
        # Hash password
        hashed = bcrypt_module.hashpw(data.password.encode('utf-8'), bcrypt_module.gensalt())
        
        # Create seller (pre-approved)
        seller = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "phone": data.phone,
            "email": data.email,
            "password": hashed.decode('utf-8'),
            "role": "seller",
            "referral_code": referral_code,
            "city": data.city,
            "experience_years": data.experience_years,
            "approval_status": "approved",
            "approved_by": current_user['id'],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
            "total_referrals": 0,
            "successful_deals": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(seller)
        
        # Create wallet
        wallet = {
            "id": str(uuid.uuid4()),
            "seller_id": seller["id"],
            "total_earnings": 0.0,
            "pending_earnings": 0.0,
            "approved_earnings": 0.0,
            "paid_earnings": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.seller_wallets.insert_one(wallet)
        
        return {
            "success": True,
            "seller_id": seller["id"],
            "referral_code": referral_code
        }
    
    @api_router.post("/admin/deals/{visit_id}/close")
    async def close_deal(visit_id: str, data: DealClosureRequest, current_user: dict = Depends(get_current_user)):
        """Admin: Close deal and credit seller commission"""
        if current_user.get('role') not in ['admin', 'support_admin']:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
        
        if not visit.get("referred_by"):
            raise HTTPException(status_code=400, detail="This visit has no seller referral")
        
        seller_id = visit["referred_by"]
        commission = calculate_commission(data.brokerage_amount)
        
        # Create commission record
        commission_record = {
            "id": str(uuid.uuid4()),
            "seller_id": seller_id,
            "visit_id": visit_id,
            "client_id": visit["customer_id"],
            "property_id": visit.get("property_ids", [""])[0] if visit.get("property_ids") else "",
            "brokerage_amount": data.brokerage_amount,
            "commission_amount": commission,
            "status": "approved",
            "approved_by": current_user['id'],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "notes": data.notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.seller_commissions.insert_one(commission_record)
        
        # Update seller wallet
        await db.seller_wallets.update_one(
            {"seller_id": seller_id},
            {
                "$inc": {
                    "total_earnings": commission,
                    "approved_earnings": commission
                }
            }
        )
        
        # Update referral status
        await db.seller_referrals.update_one(
            {"seller_id": seller_id, "visit_id": visit_id},
            {"$set": {
                "status": "deal_closed",
                "brokerage_amount": data.brokerage_amount,
                "commission_amount": commission,
                "commission_status": "approved",
                "deal_closed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update seller stats
        await db.users.update_one(
            {"id": seller_id},
            {"$inc": {"successful_deals": 1}}
        )
        
        # Update visit
        await db.visit_bookings.update_one(
            {"id": visit_id},
            {"$set": {
                "deal_closed": True,
                "brokerage_amount": data.brokerage_amount,
                "seller_commission": commission
            }}
        )
        
        return {
            "success": True,
            "brokerage": data.brokerage_amount,
            "commission": commission,
            "seller_id": seller_id
        }
    
    @api_router.post("/admin/sellers/{seller_id}/payout")
    async def process_seller_payout(seller_id: str, amount: float, current_user: dict = Depends(get_current_user)):
        """Admin: Process payout to seller"""
        if current_user.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        wallet = await db.seller_wallets.find_one({"seller_id": seller_id})
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        if amount > wallet.get("approved_earnings", 0):
            raise HTTPException(status_code=400, detail="Insufficient approved earnings")
        
        # Update wallet
        await db.seller_wallets.update_one(
            {"seller_id": seller_id},
            {
                "$inc": {
                    "approved_earnings": -amount,
                    "paid_earnings": amount
                }
            }
        )
        
        # Update commission records to paid
        await db.seller_commissions.update_many(
            {"seller_id": seller_id, "status": "approved"},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "amount_paid": amount}
    
    # ============ CLIENT REGISTRATION WITH REFERRAL ============
    
    @api_router.post("/auth/register-with-referral")
    async def register_with_referral(
        name: str,
        phone: str,
        password: str,
        referral_code: Optional[str] = None,
        property_id: Optional[str] = None
    ):
        """Register client with optional seller referral code"""
        # Check if phone exists
        existing = await db.users.find_one({"phone": phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered")
        
        # Hash password
        hashed = bcrypt_module.hashpw(password.encode('utf-8'), bcrypt_module.gensalt())
        
        # Create user
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "phone": phone,
            "password": hashed.decode('utf-8'),
            "role": "customer",
            "referred_by": None,
            "referral_code_used": referral_code,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Process referral if provided
        if referral_code:
            seller = await db.users.find_one({
                "referral_code": referral_code,
                "role": "seller",
                "approval_status": "approved"
            })
            
            if seller:
                user["referred_by"] = seller["id"]
                
                # Update referral record if property_id provided
                if property_id:
                    await db.seller_referrals.update_one(
                        {
                            "seller_id": seller["id"],
                            "property_id": property_id,
                            "status": "shared"
                        },
                        {"$set": {
                            "client_id": user["id"],
                            "client_name": name,
                            "client_phone": phone,
                            "status": "registered",
                            "converted_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        await db.users.insert_one(user)
        
        # Generate token
        import jwt
        token = jwt.encode(
            {"user_id": user["id"], "role": user["role"], "exp": datetime.now(timezone.utc) + timedelta(days=30)},
            os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024'),
            algorithm='HS256'
        )
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "phone": user["phone"],
                "role": user["role"]
            }
        }
    
    return router
