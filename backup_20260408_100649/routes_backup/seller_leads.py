"""
Seller Leads Management Routes
Handles lead receiving, assignment, and webhook for external sources
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import os
import hmac
import hashlib

router = APIRouter(tags=["seller-leads"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# JWT auth
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'apnaghr-webhook-secret-2024')

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


# Models
class SellerLead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    budget: Optional[str] = None
    property_type: Optional[str] = None
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    requirements: Optional[str] = None
    source: str = "manual"  # manual, webhook, auto_assign
    status: str = "new"  # new, contacted, interested, site_visit, negotiating, converted, lost
    notes: Optional[str] = None
    is_hot: bool = False
    assigned_by: Optional[str] = None
    assigned_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class LeadCreateRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    budget: Optional[str] = None
    property_type: Optional[str] = None
    property_id: Optional[str] = None
    requirements: Optional[str] = None
    is_hot: bool = False


class LeadUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class LeadSettingsUpdate(BaseModel):
    can_receive_leads: Optional[bool] = None
    lead_areas: Optional[List[str]] = None


class WebhookLeadRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    budget: Optional[str] = None
    property_type: Optional[str] = None
    requirements: Optional[str] = None
    source_name: Optional[str] = "external"
    is_hot: bool = False
    target_seller_id: Optional[str] = None  # Optional specific seller
    auto_assign: bool = True  # Auto-assign based on area


# ============ SELLER ENDPOINTS ============

@router.get("/seller/leads")
async def get_seller_leads(current_user: dict = Depends(get_current_user)):
    """Get all leads assigned to the seller"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    # Check if seller can receive leads
    if not current_user.get('can_receive_leads') and not current_user.get('admin_lead_enabled'):
        raise HTTPException(status_code=403, detail="Lead receiving not enabled for your account")
    
    leads = await db.seller_leads.find(
        {"seller_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate stats
    total = len(leads)
    new_count = len([l for l in leads if l.get('status') == 'new'])
    converted = len([l for l in leads if l.get('status') == 'converted'])
    
    return {
        "leads": leads,
        "stats": {
            "total": total,
            "new": new_count,
            "converted": converted
        }
    }


@router.get("/seller/lead-settings")
async def get_seller_lead_settings(current_user: dict = Depends(get_current_user)):
    """Get seller's lead receiving settings"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    return {
        "can_receive_leads": current_user.get('can_receive_leads', False),
        "admin_enabled": current_user.get('admin_lead_enabled', False),
        "lead_areas": current_user.get('lead_areas', [])
    }


@router.patch("/seller/lead-settings")
async def update_seller_lead_settings(
    settings: LeadSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update seller's lead settings"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    # Only allow updating if admin has enabled leads for this seller
    if not current_user.get('admin_lead_enabled') and settings.can_receive_leads:
        raise HTTPException(status_code=403, detail="Admin must enable leads for your account first")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if settings.can_receive_leads is not None:
        update_data["can_receive_leads"] = settings.can_receive_leads
    
    if settings.lead_areas is not None:
        update_data["lead_areas"] = settings.lead_areas
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": update_data}
    )
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    return {
        "can_receive_leads": user.get('can_receive_leads', False),
        "admin_enabled": user.get('admin_lead_enabled', False),
        "lead_areas": user.get('lead_areas', [])
    }


@router.patch("/seller/leads/{lead_id}")
async def update_seller_lead(
    lead_id: str,
    update_data: LeadUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update lead status"""
    if current_user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Seller access required")
    
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    
    if update_data.status:
        update_dict["status"] = update_data.status
        if update_data.status == "converted":
            update_dict["converted_at"] = datetime.now(timezone.utc)
    
    if update_data.notes:
        update_dict["notes"] = update_data.notes
    
    result = await db.seller_leads.update_one(
        {"id": lead_id, "seller_id": current_user['id']},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"success": True}


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/seller-leads")
async def admin_get_all_seller_leads(
    current_user: dict = Depends(get_current_user),
    seller_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all seller leads - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if seller_id:
        query["seller_id"] = seller_id
    if status:
        query["status"] = status
    
    leads = await db.seller_leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return leads


@router.post("/admin/seller-leads/assign")
async def admin_assign_lead(
    lead_data: LeadCreateRequest,
    seller_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Manually assign a lead to a seller - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify seller exists and can receive leads
    seller = await db.users.find_one({"id": seller_id, "role": "seller"}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    if not seller.get('admin_lead_enabled'):
        raise HTTPException(status_code=400, detail="Seller is not enabled to receive leads")
    
    # Get property title if property_id provided
    property_title = None
    if lead_data.property_id:
        prop = await db.properties.find_one({"id": lead_data.property_id}, {"_id": 0, "title": 1})
        if prop:
            property_title = prop.get("title")
    
    lead = SellerLead(
        seller_id=seller_id,
        name=lead_data.name,
        phone=lead_data.phone,
        email=lead_data.email,
        city=lead_data.city,
        area=lead_data.area,
        budget=lead_data.budget,
        property_type=lead_data.property_type,
        property_id=lead_data.property_id,
        property_title=property_title,
        requirements=lead_data.requirements,
        is_hot=lead_data.is_hot,
        source="manual",
        assigned_by=current_user['id'],
        assigned_at=datetime.now(timezone.utc)
    )
    
    await db.seller_leads.insert_one(lead.dict())
    return {"success": True, "lead_id": lead.id}


@router.patch("/admin/sellers/{seller_id}/lead-access")
async def admin_toggle_seller_lead_access(
    seller_id: str,
    enable: bool,
    current_user: dict = Depends(get_current_user)
):
    """Enable/disable lead receiving for a seller - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": seller_id, "role": "seller"},
        {"$set": {
            "admin_lead_enabled": enable,
            "can_receive_leads": enable,  # Auto-enable when admin enables
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    return {"success": True, "enabled": enable}


@router.get("/admin/sellers/lead-enabled")
async def admin_get_lead_enabled_sellers(current_user: dict = Depends(get_current_user)):
    """Get all sellers with lead receiving enabled - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    sellers = await db.users.find(
        {"role": "seller", "admin_lead_enabled": True},
        {"_id": 0, "password_hash": 0}
    ).to_list(None)
    
    return sellers


# ============ WEBHOOK ENDPOINT ============

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify webhook signature using HMAC"""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook/leads")
async def webhook_receive_lead(
    lead_data: WebhookLeadRequest,
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Receive leads from external sources via webhook
    
    Headers:
    - X-Webhook-Signature: HMAC-SHA256 signature of the request body
    
    Body:
    - name: Customer name (required)
    - phone: Customer phone (required)
    - email: Customer email (optional)
    - city: City preference (optional, used for auto-assignment)
    - area: Area preference (optional)
    - budget: Budget range (optional)
    - property_type: Preferred property type (optional)
    - requirements: Additional requirements (optional)
    - source_name: Name of the lead source (optional)
    - is_hot: Mark as hot lead (optional)
    - target_seller_id: Assign to specific seller (optional)
    - auto_assign: Auto-assign based on area (default: true)
    """
    # Verify signature if provided
    if x_webhook_signature:
        body = await request.body()
        if not verify_webhook_signature(body, x_webhook_signature):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Find seller to assign
    seller_id = None
    seller = None
    
    if lead_data.target_seller_id:
        # Assign to specific seller
        seller = await db.users.find_one({
            "id": lead_data.target_seller_id,
            "role": "seller",
            "admin_lead_enabled": True,
            "can_receive_leads": True
        }, {"_id": 0})
        if seller:
            seller_id = seller['id']
    
    elif lead_data.auto_assign and lead_data.city:
        # Auto-assign based on city/area
        city_lower = lead_data.city.lower()
        area_lower = lead_data.area.lower() if lead_data.area else ""
        
        # Find seller with matching area
        sellers = await db.users.find({
            "role": "seller",
            "admin_lead_enabled": True,
            "can_receive_leads": True
        }, {"_id": 0}).to_list(None)
        
        for s in sellers:
            seller_areas = [a.lower() for a in s.get('lead_areas', [])]
            if city_lower in seller_areas or area_lower in seller_areas:
                seller_id = s['id']
                seller = s
                break
        
        # If no area match, assign to any available seller (round-robin could be implemented)
        if not seller_id and sellers:
            seller = sellers[0]
            seller_id = seller['id']
    
    if not seller_id:
        # Store as unassigned lead
        lead = SellerLead(
            seller_id="unassigned",
            name=lead_data.name,
            phone=lead_data.phone,
            email=lead_data.email,
            city=lead_data.city,
            area=lead_data.area,
            budget=lead_data.budget,
            property_type=lead_data.property_type,
            requirements=lead_data.requirements,
            is_hot=lead_data.is_hot,
            source=f"webhook:{lead_data.source_name}"
        )
        await db.seller_leads.insert_one(lead.dict())
        return {
            "success": True,
            "lead_id": lead.id,
            "assigned": False,
            "message": "Lead stored but no seller available for assignment"
        }
    
    # Create and assign lead
    lead = SellerLead(
        seller_id=seller_id,
        name=lead_data.name,
        phone=lead_data.phone,
        email=lead_data.email,
        city=lead_data.city,
        area=lead_data.area,
        budget=lead_data.budget,
        property_type=lead_data.property_type,
        requirements=lead_data.requirements,
        is_hot=lead_data.is_hot,
        source=f"webhook:{lead_data.source_name}",
        assigned_at=datetime.now(timezone.utc)
    )
    
    await db.seller_leads.insert_one(lead.dict())
    
    return {
        "success": True,
        "lead_id": lead.id,
        "assigned": True,
        "assigned_to": seller.get('name') if seller else None
    }
