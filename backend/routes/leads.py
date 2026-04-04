"""
Leads Routes - Lead tracking and management
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter(tags=["leads"])

# Import db and auth from main server
from server import db, get_current_user

# ============ MODELS ============

class Lead(BaseModel):
    """Track all leads from app interactions"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    property_city: Optional[str] = None
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    referred_by_seller_id: Optional[str] = None
    referred_by_seller_name: Optional[str] = None
    seller_referral_code: Optional[str] = None
    visit_id: Optional[str] = None
    visit_date: Optional[str] = None
    visit_status: Optional[str] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    page_url: Optional[str] = None
    status: str = "new"
    notes: Optional[str] = None
    contacted_by: Optional[str] = None
    contacted_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class LeadCreate(BaseModel):
    source: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    property_id: Optional[str] = None
    user_id: Optional[str] = None
    referred_by_seller_id: Optional[str] = None
    seller_referral_code: Optional[str] = None
    device_info: Optional[str] = None
    page_url: Optional[str] = None


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None


# ============ ROUTES ============

@router.post("/leads/track")
async def track_lead(lead_data: LeadCreate, request: Request):
    """Track a new lead from app interaction - PUBLIC endpoint"""
    property_title = None
    property_city = None
    if lead_data.property_id:
        prop = await db.properties.find_one({"id": lead_data.property_id}, {"_id": 0, "title": 1, "city": 1})
        if prop:
            property_title = prop.get("title")
            property_city = prop.get("city")
    
    seller_name = None
    if lead_data.referred_by_seller_id:
        seller = await db.users.find_one({"id": lead_data.referred_by_seller_id}, {"_id": 0, "name": 1})
        if seller:
            seller_name = seller.get("name")
    
    user_role = None
    user_name = None
    user_phone = None
    if lead_data.user_id:
        user = await db.users.find_one({"id": lead_data.user_id}, {"_id": 0, "name": 1, "phone": 1, "role": 1})
        if user:
            user_role = user.get("role")
            user_name = user.get("name")
            user_phone = user.get("phone")
    
    lead = Lead(
        source=lead_data.source,
        name=lead_data.name or user_name,
        phone=lead_data.phone or user_phone,
        property_id=lead_data.property_id,
        property_title=property_title,
        property_city=property_city,
        user_id=lead_data.user_id,
        user_role=user_role,
        referred_by_seller_id=lead_data.referred_by_seller_id,
        referred_by_seller_name=seller_name,
        seller_referral_code=lead_data.seller_referral_code,
        device_info=lead_data.device_info,
        ip_address=request.client.host if request.client else None,
        page_url=lead_data.page_url
    )
    
    await db.leads.insert_one(lead.model_dump())
    return {"success": True, "lead_id": lead.id}


@router.get("/admin/leads")
async def get_all_leads(
    current_user: dict = Depends(get_current_user),
    source: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all leads - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if source:
        query["source"] = source
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    total = await db.leads.count_documents(query)
    
    return {"leads": leads, "total": total}


@router.get("/admin/leads/stats")
async def get_lead_stats(current_user: dict = Depends(get_current_user)):
    """Get lead statistics - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pipeline = [
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    source_stats = await db.leads.aggregate(pipeline).to_list(None)
    by_source = {s["_id"]: s["count"] for s in source_stats}
    
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_stats = await db.leads.aggregate(status_pipeline).to_list(None)
    by_status = {s["_id"]: s["count"] for s in status_stats}
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = await db.leads.count_documents({"created_at": {"$gte": today_start}})
    
    seller_referral_count = await db.leads.count_documents({"referred_by_seller_id": {"$ne": None}})
    
    total = await db.leads.count_documents({})
    
    return {
        "total": total,
        "today": today_count,
        "by_source": by_source,
        "by_status": by_status,
        "seller_referrals": seller_referral_count
    }


@router.patch("/admin/leads/{lead_id}")
async def update_lead(lead_id: str, update_data: LeadUpdate, current_user: dict = Depends(get_current_user)):
    """Update lead status - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    
    if update_data.status:
        update_dict["status"] = update_data.status
        if update_data.status == "contacted":
            update_dict["contacted_by"] = current_user['id']
            update_dict["contacted_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data.notes:
        update_dict["notes"] = update_data.notes
    
    if update_data.name:
        update_dict["name"] = update_data.name
    
    if update_data.phone:
        update_dict["phone"] = update_data.phone
    
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_dict})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return lead


@router.delete("/admin/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a lead - Admin only"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"success": True}
