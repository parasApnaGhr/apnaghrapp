"""
Upload Routes Module
Handles: Image uploads, video uploads, file storage
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
import aiofiles
import jwt
import os

router = APIRouter()
security = HTTPBearer()

# Database reference (set from server.py)
db = None
UPLOAD_DIR = Path("/app/backend/uploads")
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

def set_database(database):
    global db
    db = database

# ============ AUTH HELPER ============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ FILE UPLOAD ROUTES ============

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload any image or video file - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    content_type = file.content_type or ""
    
    if not (content_type.startswith('image/') or content_type.startswith('video/')):
        raise HTTPException(status_code=400, detail="File must be an image or video")
    
    # Use MongoDB GridFS for permanent storage
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename'], "size": result['size'], "type": content_type}

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload image - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename']}

@router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload video - stored permanently in MongoDB"""
    from services.image_storage import get_image_storage
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    storage = await get_image_storage(db)
    result = await storage.upload_image(file, current_user.get('id'))
    
    return {"url": result['url'], "filename": result['filename']}

@router.post("/upload/explainer-video")
async def upload_explainer_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload the 'How It Works' explainer video (admin only)"""
    if current_user['role'] not in ['admin', 'inventory_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"explainer_video.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    video_url = f"/uploads/{file_name}"
    
    # Save to settings
    await db.app_settings.update_one(
        {"key": "explainer_video"},
        {"$set": {"key": "explainer_video", "value": video_url}},
        upsert=True
    )
    
    return {"url": video_url, "message": "Explainer video uploaded successfully"}

# ============ SETTINGS ROUTES ============

@router.get("/settings/explainer-video")
async def get_explainer_video():
    """Get the explainer video URL"""
    setting = await db.app_settings.find_one({"key": "explainer_video"}, {"_id": 0})
    if setting:
        return {"video_url": setting.get("value")}
    return {"video_url": None}
