"""
Production Data Seeder for ApnaGhr Visit Platform
This script seeds the production database with data exported from preview.
It only inserts data if the collections are empty (first deployment).
"""

import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
SEED_DATA_FILE = SCRIPT_DIR / "seed_data.json"

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


async def seed_production_data(db):
    """
    Seed production database with preview data.
    Only seeds if collections are empty to avoid duplicates.
    """
    
    if not SEED_DATA_FILE.exists():
        logger.info("No seed_data.json found, skipping production seeding")
        return
    
    try:
        with open(SEED_DATA_FILE, 'r') as f:
            data = json.load(f)
        
        total_seeded = 0
        
        for collection_name in COLLECTIONS_TO_SEED:
            try:
                collection = db[collection_name]
                count = await collection.count_documents({})
                
                if count == 0 and data.get(collection_name):
                    items = data[collection_name]
                    if items and len(items) > 0:
                        await collection.insert_many(items)
                        logger.info(f"Seeded {len(items)} documents to {collection_name}")
                        total_seeded += len(items)
                    else:
                        logger.info(f"No data for {collection_name}, skipping")
                else:
                    if count > 0:
                        logger.info(f"{collection_name} has {count} documents, skipping")
                    else:
                        logger.info(f"No data for {collection_name} in seed file")
            except Exception as e:
                logger.warning(f"Error seeding {collection_name}: {str(e)}")
        
        logger.info(f"Production data seeding completed. Total documents seeded: {total_seeded}")
        
    except Exception as e:
        logger.error(f"Error seeding production data: {str(e)}")
