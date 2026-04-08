"""
Database connection and utilities for ApnaGhr Visit Platform
Handles MongoDB connection with connection pooling
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

# Global database instance
_db = None
_client = None

def get_database():
    """Get the database instance"""
    global _db
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _db

def get_client():
    """Get the MongoDB client"""
    global _client
    return _client

async def init_database():
    """Initialize database connection with connection pooling"""
    global _db, _client
    
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME = os.environ.get('DB_NAME', 'apnaghr_visit_db')
    
    # Connection pooling settings for production
    _client = AsyncIOMotorClient(
        MONGO_URL,
        maxPoolSize=50,
        minPoolSize=10,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        retryWrites=True
    )
    
    _db = _client[DB_NAME]
    
    # Test connection
    try:
        await _client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
    return _db

async def close_database():
    """Close database connection"""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """Create database indexes for performance"""
    db = get_database()
    
    try:
        # Users indexes
        await db.users.create_index("id", unique=True)
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("role")
        
        # Properties indexes
        await db.properties.create_index("id", unique=True)
        await db.properties.create_index("city")
        await db.properties.create_index("is_available")
        await db.properties.create_index("is_hot")
        await db.properties.create_index("added_by")
        await db.properties.create_index([("city", 1), ("is_available", 1)])
        
        # Visit bookings indexes
        await db.visit_bookings.create_index("id", unique=True)
        await db.visit_bookings.create_index("customer_id")
        await db.visit_bookings.create_index("rider_id")
        await db.visit_bookings.create_index("status")
        await db.visit_bookings.create_index("scheduled_date")
        
        # Seller followups indexes
        await db.seller_followups.create_index("id", unique=True)
        await db.seller_followups.create_index("seller_id")
        await db.seller_followups.create_index("client_phone")
        await db.seller_followups.create_index([("seller_id", 1), ("client_phone", 1)])
        
        # Seller daily activity indexes
        await db.seller_daily_activity.create_index("seller_id")
        await db.seller_daily_activity.create_index("date")
        await db.seller_daily_activity.create_index([("seller_id", 1), ("date", 1)])
        
        # Payment transactions indexes
        await db.payment_transactions.create_index("id", unique=True)
        await db.payment_transactions.create_index("user_id")
        await db.payment_transactions.create_index("order_id")
        
        # Notifications indexes
        await db.notifications.create_index("user_id")
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
        
        # Inventory sessions indexes
        await db.inventory_sessions.create_index("user_id")
        await db.inventory_sessions.create_index("session_date")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")

# Dependency for FastAPI routes
async def get_db():
    """FastAPI dependency to get database"""
    return get_database()
