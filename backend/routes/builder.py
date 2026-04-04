"""
Builder Routes - Project management, events, leads for builders
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/builder", tags=["builder"])

# Import db and auth from main server
from server import db, get_current_user

# ============ MODELS ============

class BuilderProject(BaseModel):
    """Builder project - Pre-Pre Launch, Pre-Launch, or Launched"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    builder_id: str
    builder_name: Optional[str] = None
    builder_company: Optional[str] = None
    builder_phone: Optional[str] = None
    builder_email: Optional[str] = None
    
    project_name: str
    project_type: str
    phase: str
    description: str
    
    city: str
    locality: str
    full_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    unit_types: List[str] = []
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    total_area_sqft: Optional[float] = None
    possession_date: Optional[str] = None
    rera_number: Optional[str] = None
    
    land_area_acres: Optional[float] = None
    expected_clu_date: Optional[str] = None
    investment_start_amount: Optional[float] = None
    expected_returns_percent: Optional[float] = None
    
    clu_status: Optional[str] = None
    clu_number: Optional[str] = None
    booking_amount: Optional[float] = None
    
    images: List[str] = []
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    floor_plans: List[str] = []
    amenities: List[str] = []
    
    subscription_plan: str = "none"
    subscription_amount: float = 0
    subscription_start: Optional[str] = None
    subscription_end: Optional[str] = None
    subscription_status: str = "inactive"
    
    commission_percent: float = 2.0
    
    total_views: int = 0
    total_clicks: int = 0
    total_inquiries: int = 0
    total_site_visits: int = 0
    
    status: str = "pending"
    is_featured: bool = False
    admin_notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class BuilderProjectCreate(BaseModel):
    project_name: str
    project_type: str
    phase: str
    description: str
    city: str
    locality: str
    full_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_units: Optional[int] = None
    unit_types: List[str] = []
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    total_area_sqft: Optional[float] = None
    possession_date: Optional[str] = None
    rera_number: Optional[str] = None
    land_area_acres: Optional[float] = None
    expected_clu_date: Optional[str] = None
    investment_start_amount: Optional[float] = None
    expected_returns_percent: Optional[float] = None
    clu_status: Optional[str] = None
    clu_number: Optional[str] = None
    booking_amount: Optional[float] = None
    images: List[str] = []
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    floor_plans: List[str] = []
    amenities: List[str] = []


class BuilderEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    builder_id: str
    
    event_name: str
    event_type: str
    description: str
    
    city: str
    venue: str
    venue_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    event_date: str
    start_time: str
    end_time: str
    
    max_attendees: int = 50
    registered_count: int = 0
    attended_count: int = 0
    
    registration_fee: float = 0
    is_registration_open: bool = True
    
    status: str = "upcoming"
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BuilderProjectLead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    builder_id: str
    
    name: str
    phone: str
    email: Optional[str] = None
    
    interested_unit_type: Optional[str] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    
    source: str
    page_url: Optional[str] = None
    
    site_visit_scheduled: bool = False
    site_visit_date: Optional[str] = None
    site_visit_status: Optional[str] = None
    rider_id: Optional[str] = None
    
    status: str = "new"
    notes: Optional[str] = None
    
    is_converted: bool = False
    deal_amount: Optional[float] = None
    commission_amount: Optional[float] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


# ============ ROUTES ============

@router.get("/projects")
async def get_builder_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects for logged in builder"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    projects = await db.builder_projects.find(
        {"builder_id": current_user['id']}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    return projects


@router.post("/projects")
async def create_builder_project(project_data: BuilderProjectCreate, current_user: dict = Depends(get_current_user)):
    """Create a new builder project"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    subscription_amount = 0
    subscription_plan = "none"
    if project_data.phase == "pre_pre_launch":
        subscription_amount = 35000
        subscription_plan = "pre_pre_launch"
    else:
        subscription_amount = 16799
        subscription_plan = "standard"
    
    project = BuilderProject(
        builder_id=current_user['id'],
        builder_name=current_user.get('name'),
        builder_company=current_user.get('company_name'),
        builder_phone=current_user.get('phone'),
        builder_email=current_user.get('email'),
        subscription_plan=subscription_plan,
        subscription_amount=subscription_amount,
        **project_data.model_dump()
    )
    
    await db.builder_projects.insert_one(project.model_dump())
    return project.model_dump()


@router.get("/projects/{project_id}")
async def get_builder_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific project details"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    project = await db.builder_projects.find_one(
        {"id": project_id, "builder_id": current_user['id']},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


@router.put("/projects/{project_id}")
async def update_builder_project(project_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update builder project"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.builder_projects.update_one(
        {"id": project_id, "builder_id": current_user['id']},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = await db.builder_projects.find_one({"id": project_id}, {"_id": 0})
    return project


@router.get("/projects/{project_id}/leads")
async def get_project_leads(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get all leads for a specific project"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    project = await db.builder_projects.find_one({"id": project_id, "builder_id": current_user['id']})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    leads = await db.builder_project_leads.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    return leads


@router.patch("/projects/{project_id}/leads/{lead_id}")
async def update_project_lead(project_id: str, lead_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update lead status"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.builder_project_leads.update_one(
        {"id": lead_id, "project_id": project_id, "builder_id": current_user['id']},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = await db.builder_project_leads.find_one({"id": lead_id}, {"_id": 0})
    return lead


@router.get("/dashboard/stats")
async def get_builder_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get builder dashboard statistics"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    builder_id = current_user['id']
    
    total_projects = await db.builder_projects.count_documents({"builder_id": builder_id})
    active_projects = await db.builder_projects.count_documents({"builder_id": builder_id, "status": "active"})
    
    pre_pre_launch = await db.builder_projects.count_documents({"builder_id": builder_id, "phase": "pre_pre_launch"})
    pre_launch = await db.builder_projects.count_documents({"builder_id": builder_id, "phase": "pre_launch"})
    launched = await db.builder_projects.count_documents({"builder_id": builder_id, "phase": "launched"})
    
    total_leads = await db.builder_project_leads.count_documents({"builder_id": builder_id})
    new_leads = await db.builder_project_leads.count_documents({"builder_id": builder_id, "status": "new"})
    converted_leads = await db.builder_project_leads.count_documents({"builder_id": builder_id, "is_converted": True})
    
    pipeline = [
        {"$match": {"builder_id": builder_id}},
        {"$group": {
            "_id": None,
            "total_views": {"$sum": "$total_views"},
            "total_clicks": {"$sum": "$total_clicks"},
            "total_inquiries": {"$sum": "$total_inquiries"},
            "total_site_visits": {"$sum": "$total_site_visits"}
        }}
    ]
    analytics = await db.builder_projects.aggregate(pipeline).to_list(1)
    analytics_data = analytics[0] if analytics else {"total_views": 0, "total_clicks": 0, "total_inquiries": 0, "total_site_visits": 0}
    
    total_events = await db.builder_events.count_documents({"builder_id": builder_id})
    upcoming_events = await db.builder_events.count_documents({"builder_id": builder_id, "status": "upcoming"})
    
    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "pre_pre_launch": pre_pre_launch,
            "pre_launch": pre_launch,
            "launched": launched
        },
        "leads": {
            "total": total_leads,
            "new": new_leads,
            "converted": converted_leads
        },
        "analytics": {
            "total_views": analytics_data.get("total_views", 0),
            "total_clicks": analytics_data.get("total_clicks", 0),
            "total_inquiries": analytics_data.get("total_inquiries", 0),
            "total_site_visits": analytics_data.get("total_site_visits", 0)
        },
        "events": {
            "total": total_events,
            "upcoming": upcoming_events
        }
    }


# Builder Events
@router.post("/events")
async def create_builder_event(event_data: dict, current_user: dict = Depends(get_current_user)):
    """Create investor event for pre-pre launch project"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    project = await db.builder_projects.find_one({
        "id": event_data.get("project_id"),
        "builder_id": current_user['id']
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.get("phase") != "pre_pre_launch":
        raise HTTPException(status_code=400, detail="Events can only be created for Pre-Pre Launch projects")
    
    event = BuilderEvent(
        project_id=event_data.get("project_id"),
        builder_id=current_user['id'],
        event_name=event_data.get("event_name"),
        event_type=event_data.get("event_type", "investor_meetup"),
        description=event_data.get("description", ""),
        city=event_data.get("city"),
        venue=event_data.get("venue"),
        venue_address=event_data.get("venue_address", ""),
        event_date=event_data.get("event_date"),
        start_time=event_data.get("start_time"),
        end_time=event_data.get("end_time"),
        max_attendees=event_data.get("max_attendees", 50),
        registration_fee=event_data.get("registration_fee", 0)
    )
    
    await db.builder_events.insert_one(event.model_dump())
    return event.model_dump()


@router.get("/events")
async def get_builder_events(current_user: dict = Depends(get_current_user)):
    """Get all events for builder"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    events = await db.builder_events.find(
        {"builder_id": current_user['id']},
        {"_id": 0}
    ).sort("event_date", -1).to_list(None)
    
    return events


@router.get("/events/{event_id}/registrations")
async def get_event_registrations(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get all registrations for an event"""
    if current_user['role'] != 'builder':
        raise HTTPException(status_code=403, detail="Builder access required")
    
    registrations = await db.builder_event_registrations.find(
        {"event_id": event_id, "builder_id": current_user['id']},
        {"_id": 0}
    ).to_list(None)
    
    return registrations
