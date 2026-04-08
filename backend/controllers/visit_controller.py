"""
Visit Controller - Business logic for visit bookings
"""
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Optional, List
import random

from utils.helpers import generate_uuid, sanitize_mongo_doc, calculate_distance_km

class VisitController:
    def __init__(self, db):
        self.db = db
    
    async def create_booking(
        self,
        customer_id: str,
        property_ids: List[str],
        scheduled_date: str,
        scheduled_time: str,
        pickup_location: Optional[str] = None,
        pickup_lat: Optional[float] = None,
        pickup_lng: Optional[float] = None,
        referral_code: Optional[str] = None,
        amount_paid: float = 0
    ) -> dict:
        """Create a new visit booking"""
        # Validate properties exist
        for prop_id in property_ids:
            prop = await self.db.properties.find_one({"id": prop_id})
            if not prop:
                raise HTTPException(status_code=404, detail=f"Property {prop_id} not found")
        
        # Generate OTP for visit verification
        otp = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        
        booking = {
            "id": generate_uuid(),
            "customer_id": customer_id,
            "property_ids": property_ids,
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time,
            "pickup_location": pickup_location,
            "pickup_lat": pickup_lat,
            "pickup_lng": pickup_lng,
            "referral_code": referral_code,
            "status": "pending",
            "otp": otp,
            "amount_paid": amount_paid,
            "rider_id": None,
            "current_step": "booked",
            "steps": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.visit_bookings.insert_one(booking.copy())
        
        return sanitize_mongo_doc(booking)
    
    async def get_customer_bookings(self, customer_id: str, phone: Optional[str] = None) -> List[dict]:
        """Get all bookings for a customer"""
        query = {
            "$or": [
                {"customer_id": customer_id},
                {"user_id": customer_id}
            ]
        }
        if phone:
            query["$or"].append({"customer_phone": phone})
        
        bookings = await self.db.visit_bookings.find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(None)
        
        # Enrich with rider info
        for booking in bookings:
            rider_id = booking.get('rider_id') or booking.get('assigned_rider_id')
            if rider_id:
                rider = await self.db.users.find_one(
                    {"id": rider_id}, 
                    {"_id": 0, "password": 0}
                )
                if rider:
                    booking['rider_name'] = rider.get('name')
                    booking['rider_phone'] = rider.get('phone')
                    booking['rider_photo'] = rider.get('photo')
        
        return sanitize_mongo_doc(bookings)
    
    async def get_booking_by_id(self, booking_id: str) -> dict:
        """Get single booking by ID"""
        booking = await self.db.visit_bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return sanitize_mongo_doc(booking)
    
    async def assign_rider(self, booking_id: str, rider_id: str) -> dict:
        """Assign a rider to a booking"""
        # Verify rider exists and is available
        rider = await self.db.users.find_one({"id": rider_id, "role": "rider"})
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")
        
        result = await self.db.visit_bookings.update_one(
            {"id": booking_id},
            {"$set": {
                "rider_id": rider_id,
                "assigned_rider_id": rider_id,
                "status": "confirmed",
                "assigned_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return await self.get_booking_by_id(booking_id)
    
    async def update_visit_step(
        self,
        booking_id: str,
        step: str,
        rider_id: str,
        property_id: Optional[str] = None,
        notes: Optional[str] = None,
        photo_url: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None
    ) -> dict:
        """Update visit step (rider actions)"""
        booking = await self.get_booking_by_id(booking_id)
        
        # Verify rider is assigned to this booking
        if booking.get('rider_id') != rider_id and booking.get('assigned_rider_id') != rider_id:
            raise HTTPException(status_code=403, detail="Not authorized for this booking")
        
        step_data = {
            "step": step,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "property_id": property_id,
            "notes": notes,
            "photo_url": photo_url,
            "lat": lat,
            "lng": lng
        }
        
        # Update status based on step
        status_map = {
            "pickup_started": "in_progress",
            "reached_pickup": "in_progress",
            "customer_picked": "in_progress",
            "reached_property": "in_progress",
            "visit_started": "in_progress",
            "visit_completed": "in_progress",
            "all_visits_done": "completed",
            "dropped_customer": "completed"
        }
        
        new_status = status_map.get(step, booking.get('status'))
        
        await self.db.visit_bookings.update_one(
            {"id": booking_id},
            {
                "$push": {"steps": step_data},
                "$set": {"current_step": step, "status": new_status}
            }
        )
        
        return await self.get_booking_by_id(booking_id)
    
    async def cancel_booking(self, booking_id: str, user_id: str, reason: Optional[str] = None) -> dict:
        """Cancel a booking"""
        booking = await self.get_booking_by_id(booking_id)
        
        # Check if cancellation is allowed
        if booking.get('status') in ['completed', 'cancelled']:
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        
        await self.db.visit_bookings.update_one(
            {"id": booking_id},
            {"$set": {
                "status": "cancelled",
                "cancelled_by": user_id,
                "cancel_reason": reason,
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": "Booking cancelled"}
    
    async def get_tracking_info(self, booking_id: str, customer_id: str) -> dict:
        """Get real-time tracking info for a visit"""
        booking = await self.get_booking_by_id(booking_id)
        
        # Verify customer owns this booking
        if booking.get('customer_id') != customer_id and booking.get('user_id') != customer_id:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        rider_info = None
        eta_minutes = None
        distance_km = None
        
        rider_id = booking.get('rider_id') or booking.get('assigned_rider_id')
        if rider_id:
            rider = await self.db.users.find_one({"id": rider_id}, {"_id": 0, "password": 0})
            if rider:
                rider_info = {
                    "id": rider.get('id'),
                    "name": rider.get('name'),
                    "phone": rider.get('phone'),
                    "photo": rider.get('photo'),
                    "is_online": rider.get('is_online', False),
                    "current_lat": rider.get('current_lat'),
                    "current_lng": rider.get('current_lng')
                }
                
                # Calculate ETA
                if rider.get('current_lat') and rider.get('current_lng'):
                    pickup_lat = booking.get('pickup_lat')
                    pickup_lng = booking.get('pickup_lng')
                    if pickup_lat and pickup_lng:
                        distance_km = calculate_distance_km(
                            rider['current_lat'], rider['current_lng'],
                            pickup_lat, pickup_lng
                        )
                        eta_minutes = round((distance_km / 25) * 60)  # Assuming 25 km/h
        
        return {
            "booking": booking,
            "rider": rider_info,
            "eta_minutes": eta_minutes,
            "distance_km": round(distance_km, 2) if distance_km else None
        }
    
    async def get_rider_bookings(self, rider_id: str, status: Optional[str] = None) -> List[dict]:
        """Get bookings assigned to a rider"""
        query = {
            "$or": [
                {"rider_id": rider_id},
                {"assigned_rider_id": rider_id}
            ]
        }
        if status:
            query["status"] = status
        
        bookings = await self.db.visit_bookings.find(
            query, {"_id": 0}
        ).sort("scheduled_date", -1).limit(50).to_list(None)
        
        return sanitize_mongo_doc(bookings)
    
    async def get_pending_bookings(self, city: Optional[str] = None) -> List[dict]:
        """Get all pending bookings (for admin/assignment)"""
        query = {"status": "pending"}
        
        bookings = await self.db.visit_bookings.find(
            query, {"_id": 0}
        ).sort("created_at", 1).limit(100).to_list(None)
        
        # Enrich with customer info
        for booking in bookings:
            customer = await self.db.users.find_one(
                {"id": booking.get('customer_id')},
                {"_id": 0, "name": 1, "phone": 1}
            )
            if customer:
                booking['customer_name'] = customer.get('name')
                booking['customer_phone'] = customer.get('phone')
        
        return sanitize_mongo_doc(bookings)
