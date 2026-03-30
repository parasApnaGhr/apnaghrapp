"""
MongoDB-based Image Storage Service
Stores images permanently in MongoDB GridFS - survives all deployments
"""

import os
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile, HTTPException
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
import logging

logger = logging.getLogger(__name__)

class ImageStorageService:
    """Service for permanent image storage in MongoDB"""
    
    def __init__(self, db):
        self.db = db
        self.bucket = None
    
    async def initialize(self):
        """Initialize GridFS bucket"""
        from motor.motor_asyncio import AsyncIOMotorGridFSBucket
        self.bucket = AsyncIOMotorGridFSBucket(self.db)
        logger.info("Image storage service initialized with GridFS")
    
    async def upload_image(self, file: UploadFile, user_id: str = None) -> dict:
        """
        Upload image to MongoDB GridFS
        Returns: dict with image_id and url
        """
        try:
            # Read file content
            content = await file.read()
            
            # Generate unique ID
            image_id = str(uuid.uuid4())
            
            # Determine file extension
            original_filename = file.filename or "image.jpg"
            extension = original_filename.split('.')[-1].lower() if '.' in original_filename else 'jpg'
            
            # Store metadata
            metadata = {
                "original_filename": original_filename,
                "content_type": file.content_type or f"image/{extension}",
                "uploaded_by": user_id,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "size": len(content)
            }
            
            # Upload to GridFS
            filename = f"{image_id}.{extension}"
            await self.bucket.upload_from_stream(
                filename,
                content,
                metadata=metadata
            )
            
            # Return URL that points to our serve endpoint
            url = f"/api/images/{image_id}.{extension}"
            
            logger.info(f"Image uploaded: {filename}, size: {len(content)} bytes")
            
            return {
                "image_id": image_id,
                "filename": filename,
                "url": url,
                "size": len(content)
            }
            
        except Exception as e:
            logger.error(f"Error uploading image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
    async def get_image(self, filename: str) -> tuple:
        """
        Retrieve image from MongoDB GridFS
        Returns: (content_bytes, content_type)
        """
        try:
            # Find the file
            cursor = self.bucket.find({"filename": filename})
            grid_out = await cursor.to_list(length=1)
            
            if not grid_out:
                return None, None
            
            # Download the file
            file_doc = grid_out[0]
            file_id = file_doc['_id']
            stream = await self.bucket.open_download_stream(file_id)
            content = await stream.read()
            
            metadata = file_doc.get('metadata', {})
            content_type = metadata.get("content_type", "image/jpeg") if metadata else "image/jpeg"
            
            return content, content_type
            
        except Exception as e:
            logger.error(f"Error retrieving image {filename}: {str(e)}")
            return None, None
    
    async def delete_image(self, filename: str) -> bool:
        """Delete image from GridFS"""
        try:
            cursor = self.bucket.find({"filename": filename})
            grid_out = await cursor.to_list(length=1)
            
            if grid_out:
                await self.bucket.delete(grid_out[0]['_id'])
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting image {filename}: {str(e)}")
            return False
    
    async def upload_base64(self, base64_data: str, filename: str = None, user_id: str = None) -> dict:
        """
        Upload base64 encoded image to MongoDB
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64
            content = base64.b64decode(base64_data)
            
            # Generate filename
            image_id = str(uuid.uuid4())
            extension = filename.split('.')[-1] if filename and '.' in filename else 'jpg'
            full_filename = f"{image_id}.{extension}"
            
            # Store metadata
            metadata = {
                "original_filename": filename or full_filename,
                "content_type": f"image/{extension}",
                "uploaded_by": user_id,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "size": len(content)
            }
            
            # Upload to GridFS
            await self.bucket.upload_from_stream(
                full_filename,
                content,
                metadata=metadata
            )
            
            url = f"/api/images/{full_filename}"
            
            return {
                "image_id": image_id,
                "filename": full_filename,
                "url": url,
                "size": len(content)
            }
            
        except Exception as e:
            logger.error(f"Error uploading base64 image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


# Global instance
image_storage: Optional[ImageStorageService] = None

async def get_image_storage(db) -> ImageStorageService:
    """Get or create image storage service"""
    global image_storage
    if image_storage is None:
        image_storage = ImageStorageService(db)
        await image_storage.initialize()
    return image_storage
