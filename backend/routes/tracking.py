# High-Performance Real-Time Tracking Routes
# Optimized for <2s latency and 5000+ concurrent agents

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging
import asyncio
import time

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
