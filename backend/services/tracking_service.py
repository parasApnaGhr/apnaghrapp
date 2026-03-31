# Real-Time Tracking Service
# Handles WebSocket connections, location updates, and route optimization

import asyncio
import json
import logging
import math
from typing import Dict, List, Optional, Set
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from fastapi import WebSocket
import httpx

logger = logging.getLogger(__name__)

# OSRM API endpoint (free, open-source routing)
OSRM_API = "https://router.project-osrm.org"

@dataclass
class Location:
    lat: float
    lng: float
    timestamp: str
    speed: Optional[float] = None  # km/h
    heading: Optional[float] = None  # degrees

@dataclass
class RiderStatus:
    rider_id: str
    rider_name: str
    location: Location
    status: str  # online, on_duty, offline
    current_visit_id: Optional[str] = None
    assigned_visits: List[str] = None
    
    def __post_init__(self):
        if self.assigned_visits is None:
            self.assigned_visits = []

class ConnectionManager:
    """Manages WebSocket connections for real-time tracking"""
    
    def __init__(self):
        # Active connections by user type
        self.rider_connections: Dict[str, WebSocket] = {}
        self.customer_connections: Dict[str, Set[WebSocket]] = {}  # customer_id -> set of connections
        self.admin_connections: Set[WebSocket] = set()
        
        # Rider locations cache
        self.rider_locations: Dict[str, RiderStatus] = {}
        
        # Visit tracking - which customer is tracking which visit
        self.visit_trackers: Dict[str, Set[str]] = {}  # visit_id -> set of customer_ids
        
    async def connect_rider(self, websocket: WebSocket, rider_id: str, rider_name: str):
        """Connect a rider and initialize their status"""
        await websocket.accept()
        self.rider_connections[rider_id] = websocket
        self.rider_locations[rider_id] = RiderStatus(
            rider_id=rider_id,
            rider_name=rider_name,
            location=Location(lat=0, lng=0, timestamp=datetime.now(timezone.utc).isoformat()),
            status="online"
        )
        logger.info(f"Rider {rider_id} connected")
        
        # Notify admins
        await self.broadcast_to_admins({
            "type": "rider_connected",
            "rider_id": rider_id,
            "rider_name": rider_name
        })
        
    async def connect_customer(self, websocket: WebSocket, customer_id: str):
        """Connect a customer for tracking"""
        await websocket.accept()
        if customer_id not in self.customer_connections:
            self.customer_connections[customer_id] = set()
        self.customer_connections[customer_id].add(websocket)
        logger.info(f"Customer {customer_id} connected for tracking")
        
    async def connect_admin(self, websocket: WebSocket):
        """Connect an admin for monitoring"""
        await websocket.accept()
        self.admin_connections.add(websocket)
        logger.info("Admin connected for tracking")
        
        # Send current rider statuses
        await websocket.send_json({
            "type": "initial_state",
            "riders": [asdict(r) for r in self.rider_locations.values()]
        })
        
    def disconnect_rider(self, rider_id: str):
        """Disconnect a rider"""
        if rider_id in self.rider_connections:
            del self.rider_connections[rider_id]
        if rider_id in self.rider_locations:
            self.rider_locations[rider_id].status = "offline"
        logger.info(f"Rider {rider_id} disconnected")
        
    def disconnect_customer(self, websocket: WebSocket, customer_id: str):
        """Disconnect a customer"""
        if customer_id in self.customer_connections:
            self.customer_connections[customer_id].discard(websocket)
            if not self.customer_connections[customer_id]:
                del self.customer_connections[customer_id]
        logger.info(f"Customer {customer_id} disconnected")
        
    def disconnect_admin(self, websocket: WebSocket):
        """Disconnect an admin"""
        self.admin_connections.discard(websocket)
        logger.info("Admin disconnected")
        
    async def update_rider_location(self, rider_id: str, lat: float, lng: float, 
                                     speed: Optional[float] = None, heading: Optional[float] = None):
        """Update rider's location and broadcast to relevant parties"""
        if rider_id not in self.rider_locations:
            return
            
        location = Location(
            lat=lat,
            lng=lng,
            timestamp=datetime.now(timezone.utc).isoformat(),
            speed=speed,
            heading=heading
        )
        self.rider_locations[rider_id].location = location
        
        # Broadcast to admins
        await self.broadcast_to_admins({
            "type": "location_update",
            "rider_id": rider_id,
            "location": asdict(location)
        })
        
        # Broadcast to customers tracking this rider's visits
        rider_status = self.rider_locations[rider_id]
        if rider_status.current_visit_id:
            await self.broadcast_to_visit_trackers(
                rider_status.current_visit_id,
                {
                    "type": "rider_location",
                    "rider_id": rider_id,
                    "rider_name": rider_status.rider_name,
                    "location": asdict(location),
                    "status": rider_status.status
                }
            )
            
    async def update_rider_status(self, rider_id: str, status: str, 
                                   current_visit_id: Optional[str] = None):
        """Update rider's duty status"""
        if rider_id not in self.rider_locations:
            return
            
        self.rider_locations[rider_id].status = status
        if current_visit_id:
            self.rider_locations[rider_id].current_visit_id = current_visit_id
            
        await self.broadcast_to_admins({
            "type": "status_update",
            "rider_id": rider_id,
            "status": status,
            "current_visit_id": current_visit_id
        })
        
    async def broadcast_to_admins(self, message: dict):
        """Send message to all connected admins"""
        disconnected = set()
        for ws in self.admin_connections:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.add(ws)
        self.admin_connections -= disconnected
        
    async def broadcast_to_visit_trackers(self, visit_id: str, message: dict):
        """Send message to customers tracking a specific visit"""
        if visit_id not in self.visit_trackers:
            return
            
        for customer_id in self.visit_trackers[visit_id]:
            if customer_id in self.customer_connections:
                disconnected = set()
                for ws in self.customer_connections[customer_id]:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        disconnected.add(ws)
                self.customer_connections[customer_id] -= disconnected
                
    def start_tracking_visit(self, customer_id: str, visit_id: str):
        """Customer starts tracking a visit"""
        if visit_id not in self.visit_trackers:
            self.visit_trackers[visit_id] = set()
        self.visit_trackers[visit_id].add(customer_id)
        
    def stop_tracking_visit(self, customer_id: str, visit_id: str):
        """Customer stops tracking a visit"""
        if visit_id in self.visit_trackers:
            self.visit_trackers[visit_id].discard(customer_id)
            
    def get_rider_location(self, rider_id: str) -> Optional[RiderStatus]:
        """Get current location of a rider"""
        return self.rider_locations.get(rider_id)
        
    def get_all_online_riders(self) -> List[RiderStatus]:
        """Get all online riders"""
        return [r for r in self.rider_locations.values() if r.status != "offline"]


# Route optimization functions
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


async def get_route_from_osrm(coordinates: List[tuple]) -> Optional[dict]:
    """Get route from OSRM API"""
    if len(coordinates) < 2:
        return None
        
    # Format coordinates for OSRM: lon,lat;lon,lat;...
    coords_str = ";".join([f"{lon},{lat}" for lat, lon in coordinates])
    url = f"{OSRM_API}/route/v1/driving/{coords_str}?overview=full&geometries=geojson&steps=true"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    return {
                        "distance": route["distance"] / 1000,  # Convert to km
                        "duration": route["duration"] / 60,  # Convert to minutes
                        "geometry": route["geometry"],
                        "steps": route.get("legs", [{}])[0].get("steps", [])
                    }
    except Exception as e:
        logger.error(f"OSRM API error: {e}")
    return None


async def calculate_eta(origin: tuple, destination: tuple, current_speed: float = None) -> dict:
    """Calculate ETA between two points"""
    route = await get_route_from_osrm([origin, destination])
    
    if route:
        eta_minutes = route["duration"]
        distance_km = route["distance"]
    else:
        # Fallback to straight-line distance with estimated speed
        distance_km = haversine_distance(origin[0], origin[1], destination[0], destination[1])
        avg_speed = current_speed if current_speed and current_speed > 0 else 30  # km/h default
        eta_minutes = (distance_km / avg_speed) * 60
        
    return {
        "distance_km": round(distance_km, 2),
        "eta_minutes": round(eta_minutes, 1),
        "eta_text": format_eta(eta_minutes)
    }


def format_eta(minutes: float) -> str:
    """Format ETA as human readable string"""
    if minutes < 1:
        return "Less than a minute"
    elif minutes < 60:
        return f"{int(minutes)} min"
    else:
        hours = int(minutes // 60)
        mins = int(minutes % 60)
        if mins == 0:
            return f"{hours} hr"
        return f"{hours} hr {mins} min"


def optimize_visit_route(visits: List[dict], start_location: tuple) -> List[dict]:
    """
    Optimize visit order using nearest neighbor + 2-opt algorithm
    
    Args:
        visits: List of visit dicts with 'id', 'lat', 'lng'
        start_location: (lat, lng) tuple of starting point
        
    Returns:
        Optimized list of visits in order
    """
    if len(visits) <= 1:
        return visits
        
    # Nearest neighbor algorithm
    unvisited = visits.copy()
    route = []
    current_loc = start_location
    
    while unvisited:
        nearest = min(unvisited, key=lambda v: haversine_distance(
            current_loc[0], current_loc[1], v['lat'], v['lng']
        ))
        route.append(nearest)
        current_loc = (nearest['lat'], nearest['lng'])
        unvisited.remove(nearest)
    
    # 2-opt improvement
    improved = True
    while improved:
        improved = False
        for i in range(len(route) - 1):
            for j in range(i + 2, len(route)):
                if j == len(route) - 1 and i == 0:
                    continue
                    
                # Calculate current distance
                if i == 0:
                    d1 = haversine_distance(start_location[0], start_location[1], 
                                           route[i]['lat'], route[i]['lng'])
                else:
                    d1 = haversine_distance(route[i-1]['lat'], route[i-1]['lng'],
                                           route[i]['lat'], route[i]['lng'])
                d2 = haversine_distance(route[j-1]['lat'], route[j-1]['lng'],
                                       route[j]['lat'], route[j]['lng'])
                
                # Calculate new distance if we reverse segment
                if i == 0:
                    d3 = haversine_distance(start_location[0], start_location[1],
                                           route[j-1]['lat'], route[j-1]['lng'])
                else:
                    d3 = haversine_distance(route[i-1]['lat'], route[i-1]['lng'],
                                           route[j-1]['lat'], route[j-1]['lng'])
                d4 = haversine_distance(route[i]['lat'], route[i]['lng'],
                                       route[j]['lat'], route[j]['lng'])
                
                if d3 + d4 < d1 + d2:
                    route[i:j] = reversed(route[i:j])
                    improved = True
                    
    # Add order numbers
    for idx, visit in enumerate(route):
        visit['order'] = idx + 1
        
    return route


def is_within_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_meters: float) -> bool:
    """Check if two points are within given radius"""
    distance_km = haversine_distance(lat1, lon1, lat2, lon2)
    return distance_km * 1000 <= radius_meters


# Singleton connection manager
connection_manager = ConnectionManager()

def get_connection_manager() -> ConnectionManager:
    return connection_manager
