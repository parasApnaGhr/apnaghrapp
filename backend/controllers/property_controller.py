"""
Property Controller - Business logic for property management
"""
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Optional, List

from utils.helpers import generate_uuid, sanitize_mongo_doc

class PropertyController:
    def __init__(self, db):
        self.db = db
    
    async def get_all_properties(
        self, 
        city: Optional[str] = None,
        bhk: Optional[str] = None,
        property_type: Optional[str] = None,
        min_rent: Optional[float] = None,
        max_rent: Optional[float] = None,
        is_available: bool = True,
        limit: int = 100,
        skip: int = 0
    ) -> List[dict]:
        """Get properties with filters"""
        query = {}
        
        if city:
            query["city"] = {"$regex": city, "$options": "i"}
        if bhk:
            query["bhk"] = bhk
        if property_type:
            query["property_type"] = property_type
        if min_rent is not None:
            query["rent"] = {"$gte": min_rent}
        if max_rent is not None:
            query.setdefault("rent", {})["$lte"] = max_rent
        if is_available is not None:
            query["is_available"] = is_available
        
        properties = await self.db.properties.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return sanitize_mongo_doc(properties)
    
    async def get_property_by_id(self, property_id: str) -> dict:
        """Get single property by ID"""
        prop = await self.db.properties.find_one({"id": property_id}, {"_id": 0})
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        return sanitize_mongo_doc(prop)
    
    async def create_property(self, property_data: dict, added_by: str) -> dict:
        """Create a new property"""
        property_dict = property_data.copy()
        property_dict['id'] = generate_uuid()
        property_dict['added_by'] = added_by
        property_dict['is_available'] = True
        property_dict['is_verified'] = False
        property_dict['is_hot'] = False
        property_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        
        await self.db.properties.insert_one(property_dict.copy())
        
        return sanitize_mongo_doc(property_dict)
    
    async def update_property(self, property_id: str, update_data: dict) -> dict:
        """Update property"""
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await self.db.properties.update_one(
            {"id": property_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return await self.get_property_by_id(property_id)
    
    async def delete_property(self, property_id: str) -> dict:
        """Delete property (soft delete - mark as unavailable)"""
        result = await self.db.properties.update_one(
            {"id": property_id},
            {"$set": {"is_available": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return {"success": True, "message": "Property deleted"}
    
    async def update_property_status(
        self, 
        property_id: str, 
        is_available: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        is_hot: Optional[bool] = None
    ) -> dict:
        """Update property status flags"""
        update_data = {}
        if is_available is not None:
            update_data['is_available'] = is_available
        if is_verified is not None:
            update_data['is_verified'] = is_verified
        if is_hot is not None:
            update_data['is_hot'] = is_hot
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No status update provided")
        
        return await self.update_property(property_id, update_data)
    
    async def update_property_location(
        self, 
        property_id: str, 
        latitude: float, 
        longitude: float
    ) -> dict:
        """Update property GPS coordinates"""
        return await self.update_property(property_id, {
            "latitude": latitude,
            "longitude": longitude
        })
    
    async def search_properties(
        self,
        query: str,
        limit: int = 50
    ) -> List[dict]:
        """Search properties by text"""
        search_query = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"area_name": {"$regex": query, "$options": "i"}},
                {"city": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ],
            "is_available": True
        }
        
        properties = await self.db.properties.find(
            search_query, {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return sanitize_mongo_doc(properties)
    
    async def get_hot_properties(self, limit: int = 20) -> List[dict]:
        """Get hot/featured properties"""
        properties = await self.db.properties.find(
            {"is_hot": True, "is_available": True}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return sanitize_mongo_doc(properties)
    
    async def get_properties_by_city(self, city: str, limit: int = 50) -> List[dict]:
        """Get properties by city"""
        properties = await self.db.properties.find(
            {"city": {"$regex": city, "$options": "i"}, "is_available": True}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return sanitize_mongo_doc(properties)
    
    async def get_property_stats(self) -> dict:
        """Get property statistics"""
        total = await self.db.properties.count_documents({})
        available = await self.db.properties.count_documents({"is_available": True})
        verified = await self.db.properties.count_documents({"is_verified": True})
        hot = await self.db.properties.count_documents({"is_hot": True})
        
        # Get city-wise breakdown
        pipeline = [
            {"$match": {"is_available": True}},
            {"$group": {"_id": "$city", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        cities = await self.db.properties.aggregate(pipeline).to_list(10)
        
        return {
            "total": total,
            "available": available,
            "verified": verified,
            "hot": hot,
            "by_city": [{"city": c["_id"], "count": c["count"]} for c in cities]
        }
