# Real-Time Tracking Routes
# WebSocket endpoints for live tracking

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Body
from typing import Optional, List
from pydantic import BaseModel
import logging
import json
from datetime import datetime, timezone

from services.tracking_service import (
    get_connection_manager, 
    calculate_eta, 
    optimize_visit_route,
    is_within_radius,
    haversine_distance
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tracking", tags=["tracking"])

# Auto-reach detection radius in meters
REACH_RADIUS_METERS = 100


# Request/Response Models
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

@router.websocket("/rider/{rider_id}")
async def rider_tracking_websocket(websocket: WebSocket, rider_id: str, name: str = Query("Rider")):
    """
    WebSocket endpoint for rider location updates
    
    Rider sends:
    - {"type": "location", "lat": 28.6139, "lng": 77.2090, "speed": 30, "heading": 45}
    - {"type": "status", "status": "on_duty|break|offline"}
    - {"type": "visit_update", "visit_id": "xxx", "status": "on_the_way|reached|completed"}
    
    Rider receives:
    - {"type": "visits_assigned", "visits": [...]}
    - {"type": "route_optimized", "visits": [...], "total_distance": 10.5, "total_time": 45}
    - {"type": "visit_cancelled", "visit_id": "xxx"}
    """
    manager = get_connection_manager()
    await manager.connect_rider(websocket, rider_id, name)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "location":
                await manager.update_rider_location(
                    rider_id,
                    lat=data.get("lat"),
                    lng=data.get("lng"),
                    speed=data.get("speed"),
                    heading=data.get("heading")
                )
                
                # Check if rider has reached any visit location
                rider_status = manager.get_rider_location(rider_id)
                if rider_status and rider_status.current_visit_id:
                    # This would need visit location from database
                    pass
                    
            elif msg_type == "status":
                await manager.update_rider_status(
                    rider_id,
                    status=data.get("status"),
                    current_visit_id=data.get("visit_id")
                )
                
            elif msg_type == "visit_update":
                # Broadcast visit status update to customer and admin
                visit_id = data.get("visit_id")
                status = data.get("status")
                
                await manager.broadcast_to_visit_trackers(visit_id, {
                    "type": "visit_status_update",
                    "visit_id": visit_id,
                    "status": status,
                    "rider_id": rider_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
                await manager.broadcast_to_admins({
                    "type": "visit_status_update",
                    "visit_id": visit_id,
                    "status": status,
                    "rider_id": rider_id
                })
                
    except WebSocketDisconnect:
        manager.disconnect_rider(rider_id)
    except Exception as e:
        logger.error(f"Rider WebSocket error: {e}")
        manager.disconnect_rider(rider_id)


@router.websocket("/customer/{customer_id}")
async def customer_tracking_websocket(websocket: WebSocket, customer_id: str):
    """
    WebSocket endpoint for customer to track their visits
    
    Customer sends:
    - {"type": "track_visit", "visit_id": "xxx"}
    - {"type": "stop_tracking", "visit_id": "xxx"}
    
    Customer receives:
    - {"type": "rider_location", "rider_id": "xxx", "location": {...}, "eta": {...}}
    - {"type": "visit_status_update", "visit_id": "xxx", "status": "on_the_way"}
    - {"type": "rider_arriving", "visit_id": "xxx", "eta_minutes": 5}
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
                    "visit_id": visit_id
                })
                
            elif msg_type == "stop_tracking":
                visit_id = data.get("visit_id")
                manager.stop_tracking_visit(customer_id, visit_id)
                await websocket.send_json({
                    "type": "tracking_stopped",
                    "visit_id": visit_id
                })
                
    except WebSocketDisconnect:
        manager.disconnect_customer(websocket, customer_id)
    except Exception as e:
        logger.error(f"Customer WebSocket error: {e}")
        manager.disconnect_customer(websocket, customer_id)


@router.websocket("/admin")
async def admin_tracking_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for admin to monitor all riders
    
    Admin receives:
    - {"type": "initial_state", "riders": [...]}
    - {"type": "location_update", "rider_id": "xxx", "location": {...}}
    - {"type": "rider_connected", "rider_id": "xxx"}
    - {"type": "rider_disconnected", "rider_id": "xxx"}
    - {"type": "visit_status_update", ...}
    """
    manager = get_connection_manager()
    await manager.connect_admin(websocket)
    
    try:
        while True:
            # Admin can send commands
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "assign_visits":
                # Assign visits to a rider and optimize route
                rider_id = data.get("rider_id")
                visits = data.get("visits", [])
                
                if rider_id in manager.rider_connections:
                    rider_ws = manager.rider_connections[rider_id]
                    await rider_ws.send_json({
                        "type": "visits_assigned",
                        "visits": visits
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
                                "lng": r.location.lng
                            } if r.location else None
                        }
                        for r in riders
                    ]
                })
                
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
    except Exception as e:
        logger.error(f"Admin WebSocket error: {e}")
        manager.disconnect_admin(websocket)


# REST API endpoints for tracking

@router.post("/calculate-eta")
async def calculate_route_eta(request: ETARequest):
    """Calculate ETA between two points"""
    eta = await calculate_eta(
        (request.origin_lat, request.origin_lng),
        (request.dest_lat, request.dest_lng),
        request.current_speed
    )
    return eta


@router.post("/optimize-route")
async def optimize_route(request: RouteOptimizeRequest):
    """
    Optimize visit order for minimum travel time
    
    visits: List of {"id": "xxx", "lat": 28.61, "lng": 77.20, "address": "..."}
    """
    if not request.visits:
        return {"visits": [], "total_distance": 0, "total_time": 0}
    
    # Convert to dict for the optimization function
    visits_dict = [v.model_dump() for v in request.visits]
    optimized = optimize_visit_route(visits_dict, (request.start_lat, request.start_lng))
    
    # Calculate total distance and time
    total_distance = 0
    current_loc = (request.start_lat, request.start_lng)
    
    for visit in optimized:
        total_distance += haversine_distance(
            current_loc[0], current_loc[1],
            visit['lat'], visit['lng']
        )
        current_loc = (visit['lat'], visit['lng'])
    
    # Estimate time (assuming 25 km/h average in city + 15 min per visit)
    travel_time = (total_distance / 25) * 60  # minutes
    visit_time = len(optimized) * 15  # 15 min per visit
    total_time = travel_time + visit_time
    
    return {
        "visits": optimized,
        "total_distance_km": round(total_distance, 2),
        "total_time_minutes": round(total_time, 1),
        "travel_time_minutes": round(travel_time, 1),
        "visit_time_minutes": visit_time
    }


@router.get("/rider/{rider_id}/location")
async def get_rider_current_location(rider_id: str):
    """Get current location of a rider"""
    manager = get_connection_manager()
    rider = manager.get_rider_location(rider_id)
    
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found or offline")
        
    return {
        "rider_id": rider.rider_id,
        "name": rider.rider_name,
        "status": rider.status,
        "location": {
            "lat": rider.location.lat,
            "lng": rider.location.lng,
            "timestamp": rider.location.timestamp,
            "speed": rider.location.speed,
            "heading": rider.location.heading
        }
    }


@router.get("/online-riders")
async def get_online_riders():
    """Get all online riders with their locations"""
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
                "current_visit_id": r.current_visit_id,
                "assigned_visits_count": len(r.assigned_visits)
            }
            for r in riders
        ]
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
    ) * 1000  # meters
    
    return {
        "reached": reached,
        "distance_meters": round(distance, 1),
        "threshold_meters": request.radius_meters
    }
