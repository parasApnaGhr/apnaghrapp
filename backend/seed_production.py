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
        
        # Seed Users (if empty)
        user_count = await db.users.count_documents({})
        if user_count == 0 and data.get('users'):
            users = data['users']
            if users:
                await db.users.insert_many(users)
                logger.info(f"Seeded {len(users)} users to production")
        else:
            logger.info(f"Users collection has {user_count} documents, skipping user seeding")
        
        # Seed Properties (if empty)
        prop_count = await db.properties.count_documents({})
        if prop_count == 0 and data.get('properties'):
            properties = data['properties']
            if properties:
                await db.properties.insert_many(properties)
                logger.info(f"Seeded {len(properties)} properties to production")
        else:
            logger.info(f"Properties collection has {prop_count} documents, skipping property seeding")
        
        # Seed Advertisements (if empty)
        ad_count = await db.advertisements.count_documents({})
        if ad_count == 0 and data.get('advertisements'):
            ads = data['advertisements']
            if ads:
                await db.advertisements.insert_many(ads)
                logger.info(f"Seeded {len(ads)} advertisements to production")
        else:
            logger.info(f"Advertisements collection has {ad_count} documents, skipping ad seeding")
        
        # Seed Advertiser Profiles (if empty)
        profile_count = await db.advertiser_profiles.count_documents({})
        if profile_count == 0 and data.get('advertiser_profiles'):
            profiles = data['advertiser_profiles']
            if profiles:
                await db.advertiser_profiles.insert_many(profiles)
                logger.info(f"Seeded {len(profiles)} advertiser profiles to production")
        
        # Seed App Settings (if empty)
        settings_count = await db.app_settings.count_documents({})
        if settings_count == 0 and data.get('app_settings'):
            settings = data['app_settings']
            if settings:
                await db.app_settings.insert_many(settings)
                logger.info(f"Seeded {len(settings)} app settings to production")
        
        logger.info("Production data seeding completed")
        
    except Exception as e:
        logger.error(f"Error seeding production data: {str(e)}")
