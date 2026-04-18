import certifi
"""
ApnaGhr Visit Platform - Main Server
Refactored modular architecture with backward compatibility

This file handles:
- FastAPI app initialization
- Middleware configuration
- Database connection
- Route imports and registration
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from pathlib import Path
import os
import logging
import jwt

# ============ LOGGING SETUP ============
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# ============ IMPORTS FROM MODULES ============
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'
security = HTTPBearer()

# ============ DATABASE SETUP ============
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'apnaghr_visit_db')

# Global database reference
db = None
client = None

async def init_database():
    """Initialize database connection"""
    global db, client
    
    client = AsyncIOMotorClient(
        MONGO_URL, tlsCAFile=certifi.where(),
        maxPoolSize=50,
        minPoolSize=10,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000
    )
    
    db = client[DB_NAME]
    
    # Test connection
    await client.admin.command('ping')
    logger.info(f"Connected to MongoDB: {DB_NAME}")
    
    # Create indexes
    await create_indexes()
    
    return db

async def create_indexes():
    """Create database indexes for performance"""
    try:
        await db.users.create_index("id", unique=True)
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("role")
        await db.properties.create_index("id", unique=True)
        await db.properties.create_index("city")
        await db.properties.create_index([("city", 1), ("is_available", 1)])
        await db.visit_bookings.create_index("id", unique=True)
        await db.visit_bookings.create_index("customer_id")
        await db.visit_bookings.create_index("rider_id")
        await db.seller_followups.create_index("seller_id")
        await db.seller_daily_activity.create_index([("seller_id", 1), ("date", 1)])
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation: {e}")

# ============ APP LIFESPAN ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    await init_database()
    
    # Set database for all route modules
    from routes.tracking import set_database as set_tracking_db
    from routes.builder import set_database as set_builder_db
    from routes.leads import set_database as set_leads_db
    from routes.seller_leads import set_database as set_seller_leads_db
    from routes.ai_validation import set_database as set_ai_validation_db
    from routes.seller_performance import set_database as set_seller_performance_db
    from routes.auth import set_database as set_auth_db
    
    set_tracking_db(db)
    set_builder_db(db)
    set_leads_db(db)
    set_seller_leads_db(db)
    set_ai_validation_db(db)
    set_seller_performance_db(db)
    set_auth_db(db)
    
    # Run seed if needed
    try:
        from seed_production import seed_production_data
        await seed_production_data(db)
    except Exception as e:
        logger.warning(f"Seed: {e}")
    
    yield
    
    # Shutdown
    if client:
        client.close()
        logger.info("MongoDB connection closed")

# ============ CREATE APP ============
app = FastAPI(
    title="ApnaGhr Visit Platform",
    description="Property visit booking platform",
    version="2.0",
    lifespan=lifespan
)

# ============ MIDDLEWARE ============
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ STATIC FILES ============
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ============ AUTH DEPENDENCY ============
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
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ HEALTH CHECK ============
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected", "version": "2.0"}
    except:
        return {"status": "unhealthy", "database": "disconnected", "version": "2.0"}

# ============ IMPORT AND INCLUDE ROUTERS ============

# Import the original server routes (backward compatibility)
# This imports ALL existing endpoints from the original server.py
from server import api_router, setup_chatbot_routes, setup_seller_routes

# Setup chatbot and seller routes
setup_chatbot_routes(api_router, db, get_current_user)
import bcrypt
setup_seller_routes(api_router, db, get_current_user, bcrypt)

# Include the main API router (all legacy endpoints)
app.include_router(api_router)

# Include new modular routes
from routes.auth import router as auth_router
from routes.packers import router as packers_router
from routes.advertising import router as advertising_router
from routes.tracking import router as tracking_router
from routes.builder import router as builder_router
from routes.leads import router as leads_router
from routes.seller_leads import router as seller_leads_router
from routes.ai_validation import router as ai_validation_router
from routes.seller_performance import router as seller_performance_router
from routes.inventory_access import router as inventory_access_router
from routes.seller_verification import router as seller_verification_router

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(packers_router, prefix="/api", tags=["Packers"])
app.include_router(advertising_router, prefix="/api", tags=["Advertising"])
app.include_router(tracking_router, prefix="/api", tags=["Tracking"])
app.include_router(builder_router, prefix="/api", tags=["Builder"])
app.include_router(leads_router, prefix="/api", tags=["Leads"])
app.include_router(seller_leads_router, prefix="/api", tags=["Seller Leads"])
app.include_router(ai_validation_router, prefix="/api", tags=["AI Validation"])
app.include_router(seller_performance_router, prefix="/api", tags=["Seller Performance"])
app.include_router(inventory_access_router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(seller_verification_router, prefix="/api/seller-verification", tags=["Seller Verification"])

# ============ ERROR HANDLERS ============
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return {"detail": "Internal server error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
