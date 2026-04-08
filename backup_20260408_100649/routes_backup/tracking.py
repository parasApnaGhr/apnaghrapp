# High-Performance Real-Time Tracking Routes
# Optimized for <2s latency and 5000+ concurrent agents

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from typing import Optional, List
from pydantic import BaseModel
import logging
import asyncio
import time
from datetime import datetime, timezone

from services.tracking_service import (
    get_connection_manager,
    calculate_eta,
    optimize_visit_route,
    is_within_radius,
    haversine_distance,
    start_tracking_service
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tracking", tags=["tracking"])

REACH_RADIUS_METERS = 100

# Database reference - will be set by main app
db = None

def set_database(database):
    global db
    db = database


# Request Models
class ETARequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    current_speed: Optional[float] = None


class VisitLocation(BaseModel):
    id: str
    lat: float
    lng: float
    title: Optional[str] = None
    address: Optional[str] = None


class RouteOptimizeRequest(BaseModel):
    visits: List[VisitLocation]
    start_lat: float
    start_lng: float


class ReachedCheckRequest(BaseModel):
    rider_lat: float
    rider_lng: float
    dest_lat: float
    dest_lng: float
    radius_meters: float = REACH_RADIUS_METERS


class LocationUpdate(BaseModel):
    lat: float
    lng: float
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None


# WebSocket Endpoints

@router.websocket("/rider/{rider_id}")
async def rider_tracking_websocket(
    websocket: WebSocket, 
    rider_id: str, 
    name: str = Query("Rider")
):
    """
    High-performance rider WebSocket for location updates.
    
    Sends: location updates every 2-5 seconds
    Receives: visit assignments, route optimizations
    """
    manager = get_connection_manager()
    await manager.connect_rider(websocket, rider_id, name)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "location":
                # Process location update immediately
                await manager.update_rider_location(
                    rider_id,
                    lat=data.get("lat"),
                    lng=data.get("lng"),
                    speed=data.get("speed"),
                    heading=data.get("heading"),
                    accuracy=data.get("accuracy")
                )
                
            elif msg_type == "status":
                state = manager.get_rider_state(rider_id)
                if state:
                    state.status = data.get("status", "online")
                    state.current_visit_id = data.get("visit_id")
                    
            elif msg_type == "visit_update":
                # Broadcast visit status to customers and admin
                visit_id = data.get("visit_id")
                status = data.get("status")
                
                update_msg = {
                    "type": "visit_status_update",
                    "visit_id": visit_id,
                    "status": status,
                    "rider_id": rider_id,
                    "timestamp": time.time()
                }
                
                manager._queue_broadcast("admins", update_msg)
                manager._queue_broadcast(f"visit_{visit_id}", update_msg)
                
            elif msg_type == "ping":
                # Health check
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
                
    except WebSocketDisconnect:
        manager.disconnect_rider(rider_id)
    except Exception as e:
        logger.error(f"Rider WS error: {e}")
        manager.disconnect_rider(rider_id)


@router.websocket("/customer/{customer_id}")
async def customer_tracking_websocket(websocket: WebSocket, customer_id: str):
    """
    Customer WebSocket for tracking rider location.
    Low bandwidth - only receives when tracking active visit.
    """
    manager = get_connection_manager()
    await manager.connect_customer(websocket, customer_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "track_visit":
                visit_id = data.get("visit_id")
                manager.start_tracking_visit(customer_id, visit_id)
                await websocket.send_json({
                    "type": "tracking_started",
                    "visit_id": visit_id,
                    "timestamp": time.time()
                })
                
            elif msg_type == "stop_tracking":
                visit_id = data.get("visit_id")
                manager.stop_tracking_visit(customer_id, visit_id)
                await websocket.send_json({
                    "type": "tracking_stopped",
                    "visit_id": visit_id
                })
                
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
                
    except WebSocketDisconnect:
        manager.disconnect_customer(websocket, customer_id)
    except Exception as e:
        logger.error(f"Customer WS error: {e}")
        manager.disconnect_customer(websocket, customer_id)


@router.websocket("/admin")
async def admin_tracking_websocket(websocket: WebSocket):
    """
    Admin WebSocket for monitoring all riders.
    Receives batched location updates for efficiency.
    """
    manager = get_connection_manager()
    await manager.connect_admin(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "get_metrics":
                await websocket.send_json({
                    "type": "metrics",
                    "data": manager.get_metrics(),
                    "timestamp": time.time()
                })
                
            elif msg_type == "get_riders":
                riders = manager.get_all_online_riders()
                await websocket.send_json({
                    "type": "riders_list",
                    "riders": [
                        {
                            "rider_id": r.rider_id,
                            "name": r.rider_name,
                            "status": r.status,
                            "location": {
                                "lat": r.location.lat,
                                "lng": r.location.lng,
                                "timestamp": r.location.timestamp
                            } if r.location else None
                        }
                        for r in riders
                    ],
                    "timestamp": time.time()
                })
                
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
                
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
    except Exception as e:
        logger.error(f"Admin WS error: {e}")
        manager.disconnect_admin(websocket)


# REST API Endpoints

@router.post("/calculate-eta")
async def calculate_route_eta(request: ETARequest):
    """Calculate ETA using OSRM routing"""
    eta = await calculate_eta(
        (request.origin_lat, request.origin_lng),
        (request.dest_lat, request.dest_lng),
        request.current_speed
    )
    return eta


@router.post("/optimize-route")
async def optimize_route(request: RouteOptimizeRequest):
    """
    Optimize visit route for minimum travel time.
    Uses nearest neighbor + 2-opt algorithm.
    """
    if not request.visits:
        return {"visits": [], "total_distance_km": 0, "total_time_minutes": 0}
    
    visits_dict = [v.model_dump() for v in request.visits]
    optimized = optimize_visit_route(visits_dict, (request.start_lat, request.start_lng))
    
    # Calculate totals
    total_distance = 0
    current = (request.start_lat, request.start_lng)
    
    for visit in optimized:
        total_distance += haversine_distance(current[0], current[1], visit['lat'], visit['lng'])
        current = (visit['lat'], visit['lng'])
    
    # 25 km/h average city speed + 15 min per visit
    travel_time = (total_distance / 25) * 60
    visit_time = len(optimized) * 15
    
    return {
        "visits": optimized,
        "total_distance_km": round(total_distance, 2),
        "total_time_minutes": round(travel_time + visit_time, 1),
        "travel_time_minutes": round(travel_time, 1),
        "visit_time_minutes": visit_time
    }


@router.post("/check-reached")
async def check_if_reached(request: ReachedCheckRequest):
    """Check if rider has reached destination"""
    reached = is_within_radius(
        request.rider_lat, request.rider_lng,
        request.dest_lat, request.dest_lng,
        request.radius_meters
    )
    distance = haversine_distance(
        request.rider_lat, request.rider_lng,
        request.dest_lat, request.dest_lng
    ) * 1000
    
    return {
        "reached": reached,
        "distance_meters": round(distance, 1),
        "threshold_meters": request.radius_meters
    }


@router.get("/rider/{rider_id}/location")
async def get_rider_location(rider_id: str):
    """Get current location of a rider"""
    manager = get_connection_manager()
    state = manager.get_rider_state(rider_id)
    
    if not state or state.status == "offline":
        raise HTTPException(status_code=404, detail="Rider not found or offline")
    
    return {
        "rider_id": state.rider_id,
        "name": state.rider_name,
        "status": state.status,
        "location": {
            "lat": state.location.lat,
            "lng": state.location.lng,
            "speed": state.location.speed,
            "heading": state.location.heading,
            "timestamp": state.location.timestamp
        },
        "location_history": [
            {"lat": l.lat, "lng": l.lng, "timestamp": l.timestamp}
            for l in state.location_history[-3:]  # Last 3 for interpolation
        ]
    }


@router.get("/online-riders")
async def get_online_riders():
    """Get all online riders"""
    manager = get_connection_manager()
    riders = manager.get_all_online_riders()
    
    return {
        "count": len(riders),
        "riders": [
            {
                "rider_id": r.rider_id,
                "name": r.rider_name,
                "status": r.status,
                "location": {
                    "lat": r.location.lat,
                    "lng": r.location.lng
                } if r.location else None,
                "current_visit_id": r.current_visit_id
            }
            for r in riders
        ]
    }


@router.get("/metrics")
async def get_tracking_metrics():
    """Get tracking system performance metrics"""
    manager = get_connection_manager()
    return manager.get_metrics()


# ============ DATABASE-BACKED TRACKING (PERMANENT STORAGE) ============

class TrackingSessionCreate(BaseModel):
    visit_id: Optional[str] = None

class GPSLocationUpdate(BaseModel):
    lat: float
    lng: float
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None

@router.post("/session/start")
async def start_tracking_session(data: TrackingSessionCreate, rider_id: str = Query(...)):
    """Start a tracking session - stored in database"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    import uuid
    session_id = f"track_{uuid.uuid4().hex[:12]}"
    
    session = {
        "id": session_id,
        "rider_id": rider_id,
        "visit_id": data.visit_id,
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "locations": [],
        "total_distance_km": 0,
        "duration_minutes": 0
    }
    
    await db.tracking_sessions.insert_one(session)
    
    # Update rider's tracking status
    await db.users.update_one(
        {"id": rider_id},
        {"$set": {
            "tracking_active": True,
            "current_tracking_session": session_id,
            "last_tracking_start": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"session_id": session_id, "status": "active", "message": "Tracking session started"}


@router.post("/session/{session_id}/location")
async def update_session_location(session_id: str, location: GPSLocationUpdate, rider_id: str = Query(...)):
    """Update GPS location in tracking session - stored in database"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    location_entry = {
        "lat": location.lat,
        "lng": location.lng,
        "speed": location.speed,
        "heading": location.heading,
        "accuracy": location.accuracy,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Add to session locations array
    result = await db.tracking_sessions.update_one(
        {"id": session_id, "rider_id": rider_id, "status": "active"},
        {
            "$push": {"locations": location_entry},
            "$set": {"last_location": location_entry}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Active tracking session not found")
    
    # Also update rider's current location in users collection
    await db.users.update_one(
        {"id": rider_id},
        {"$set": {
            "current_lat": location.lat,
            "current_lng": location.lng,
            "last_location_update": datetime.now(timezone.utc).isoformat(),
            "current_speed": location.speed,
            "current_heading": location.heading
        }}
    )
    
    return {"status": "updated", "location": location_entry}


@router.post("/session/{session_id}/stop")
async def stop_tracking_session(session_id: str, rider_id: str = Query(...)):
    """Stop a tracking session - calculates totals and stores in database"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    session = await db.tracking_sessions.find_one(
        {"id": session_id, "rider_id": rider_id},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Tracking session not found")
    
    # Calculate total distance from locations
    locations = session.get("locations", [])
    total_distance = 0
    
    for i in range(1, len(locations)):
        total_distance += haversine_distance(
            locations[i-1]["lat"], locations[i-1]["lng"],
            locations[i]["lat"], locations[i]["lng"]
        )
    
    # Calculate duration
    started_at = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
    ended_at = datetime.now(timezone.utc)
    duration_minutes = (ended_at - started_at).total_seconds() / 60
    
    # Update session
    await db.tracking_sessions.update_one(
        {"id": session_id},
        {"$set": {
            "status": "completed",
            "ended_at": ended_at.isoformat(),
            "total_distance_km": round(total_distance, 2),
            "duration_minutes": round(duration_minutes, 1),
            "total_locations": len(locations)
        }}
    )
    
    # Update rider status
    await db.users.update_one(
        {"id": rider_id},
        {"$set": {
            "tracking_active": False,
            "current_tracking_session": None
        }}
    )
    
    return {
        "session_id": session_id,
        "status": "completed",
        "total_distance_km": round(total_distance, 2),
        "duration_minutes": round(duration_minutes, 1),
        "total_locations": len(locations)
    }


@router.get("/session/{session_id}")
async def get_tracking_session(session_id: str):
    """Get tracking session details from database"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    session = await db.tracking_sessions.find_one({"id": session_id}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=404, detail="Tracking session not found")
    
    return session


@router.get("/rider/{rider_id}/sessions")
async def get_rider_tracking_sessions(rider_id: str, limit: int = 10):
    """Get rider's tracking session history from database"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    sessions = await db.tracking_sessions.find(
        {"rider_id": rider_id},
        {"_id": 0, "locations": 0}  # Exclude locations array for list view
    ).sort("started_at", -1).limit(limit).to_list(length=limit)
    
    return {"sessions": sessions, "count": len(sessions)}


@router.get("/rider/{rider_id}/current-location")
async def get_rider_current_location_from_db(rider_id: str):
    """Get rider's current location from database (persistent)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    rider = await db.users.find_one(
        {"id": rider_id},
        {"_id": 0, "current_lat": 1, "current_lng": 1, "last_location_update": 1, 
         "current_speed": 1, "current_heading": 1, "tracking_active": 1, "name": 1}
    )
    
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    return {
        "rider_id": rider_id,
        "name": rider.get("name"),
        "lat": rider.get("current_lat"),
        "lng": rider.get("current_lng"),
        "speed": rider.get("current_speed"),
        "heading": rider.get("current_heading"),
        "last_update": rider.get("last_location_update"),
        "tracking_active": rider.get("tracking_active", False)
    }


@router.get("/visit/{visit_id}/tracking")
async def get_visit_tracking_info(visit_id: str):
    """Get tracking info for a visit including rider location and ETA"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    visit = await db.visit_bookings.find_one({"id": visit_id}, {"_id": 0})
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    result = {
        "visit_id": visit_id,
        "status": visit.get("status"),
        "rider_id": visit.get("rider_id"),
        "optimized_route": visit.get("optimized_route"),
        "rider_location": None,
        "eta": None
    }
    
    # Get rider location if assigned
    if visit.get("rider_id"):
        rider = await db.users.find_one(
            {"id": visit["rider_id"]},
            {"_id": 0, "current_lat": 1, "current_lng": 1, "last_location_update": 1, "name": 1}
        )
        
        if rider and rider.get("current_lat"):
            result["rider_location"] = {
                "lat": rider.get("current_lat"),
                "lng": rider.get("current_lng"),
                "last_update": rider.get("last_location_update"),
                "name": rider.get("name")
            }
            
            # Calculate ETA to first property
            prop_ids = visit.get("property_ids", [])
            if prop_ids:
                prop = await db.properties.find_one({"id": prop_ids[0]}, {"_id": 0, "latitude": 1, "longitude": 1})
                if prop and prop.get("latitude"):
                    eta_info = await calculate_eta(
                        (rider["current_lat"], rider["current_lng"]),
                        (prop["latitude"], prop["longitude"])
                    )
                    result["eta"] = eta_info
    
    return result

