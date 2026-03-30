"""
Production Data Seeder for ApnaGhr Visit Platform
This script seeds the production database with data exported from preview.
It only inserts data if the collections are empty (first deployment).

SAFETY FEATURES:
- Only seeds empty collections (won't overwrite existing data)
- Validates data before insertion
- Detailed logging for debugging
- Backup file support
"""

import json
import os
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
SEED_DATA_FILE = SCRIPT_DIR / "seed_data.json"
SEED_BACKUP_FILE = SCRIPT_DIR / "seed_data_backup.json"

# All collections to seed
COLLECTIONS_TO_SEED = [
    'users',
    'properties', 
    'advertisements',
    'advertiser_profiles',
    'app_settings',
    'visit_bookings',
    'visit_packages',
    'payment_transactions',
    'rider_wallets',
    'rider_transactions',
    'tolet_tasks',
    'shifting_bookings',
    'property_locks',
    'notifications',
    'chat_sessions',
    'chat_messages',
]


def validate_image_urls(data: dict) -> bool:
    """Validate that all image URLs are external (not local uploads)"""
    issues = []
    
    # Check properties
    for p in data.get('properties', []):
        for img in p.get('images', []):
            if '/uploads/' in str(img) and not str(img).startswith('https://'):
                issues.append(f"Property '{p.get('title')}' has local image")
    
    # Check ads
    for ad in data.get('advertisements', []):
        img = ad.get('banner_image', '')
        if '/uploads/' in str(img) and not str(img).startswith('https://'):
            issues.append(f"Ad has local image")
    
    if issues:
        for issue in issues:
            logger.warning(f"Image validation issue: {issue}")
        return False
    return True


async def seed_production_data(db):
    """
    Seed production database with preview data.
    Only seeds if collections are empty to avoid duplicates.
    
    SAFETY: This function will NEVER overwrite existing data.
    """
    
    # Try primary file, then backup
    seed_file = None
    if SEED_DATA_FILE.exists():
        seed_file = SEED_DATA_FILE
    elif SEED_BACKUP_FILE.exists():
        seed_file = SEED_BACKUP_FILE
        logger.info("Using backup seed file")
    
    if not seed_file:
        logger.info("No seed_data.json found, skipping production seeding")
        return
    
    try:
        with open(seed_file, 'r') as f:
            data = json.load(f)
        
        logger.info(f"Loaded seed data from {seed_file}")
        
        # Validate image URLs
        if not validate_image_urls(data):
            logger.warning("Some images have local URLs - they may not display correctly")
        
        total_seeded = 0
        skipped_collections = []
        
        for collection_name in COLLECTIONS_TO_SEED:
            try:
                collection = db[collection_name]
                existing_count = await collection.count_documents({})
                
                # SAFETY: Only seed if collection is EMPTY
                if existing_count > 0:
                    skipped_collections.append(f"{collection_name} ({existing_count} docs)")
                    continue
                
                items = data.get(collection_name, [])
                if items and len(items) > 0:
                    # Insert data
                    await collection.insert_many(items)
                    logger.info(f"✅ Seeded {len(items)} documents to {collection_name}")
                    total_seeded += len(items)
                    
            except Exception as e:
                logger.error(f"❌ Error seeding {collection_name}: {str(e)}")
        
        # Log summary
        logger.info(f"")
        logger.info(f"========== SEEDING COMPLETE ==========")
        logger.info(f"Total documents seeded: {total_seeded}")
        
        if skipped_collections:
            logger.info(f"Skipped (already have data): {', '.join(skipped_collections)}")
        
        logger.info(f"=======================================")
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in seed file: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error during seeding: {str(e)}")


async def get_seeding_status(db) -> dict:
    """Get current status of all collections"""
    status = {}
    for collection_name in COLLECTIONS_TO_SEED:
        try:
            count = await db[collection_name].count_documents({})
            status[collection_name] = count
        except:
            status[collection_name] = -1
    return status
