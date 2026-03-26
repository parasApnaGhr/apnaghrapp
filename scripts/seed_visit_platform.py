import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    print("Starting ApnaGhr Visit Platform data seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.properties.delete_many({})
    await db.visit_bookings.delete_many({})
    await db.visit_packages.delete_many({})
    await db.property_locks.delete_many({})
    await db.payment_transactions.delete_many({})
    
    print("Cleared existing data")
    
    # Create users
    users = [
        {
            "id": "customer-001",
            "name": "Rahul Kumar",
            "phone": "9999999999",
            "email": "rahul@example.com",
            "password": hash_password("test123"),
            "role": "customer"
        },
        {
            "id": "rider-001",
            "name": "Aman Singh",
            "phone": "8888888888",
            "email": "aman@example.com",
            "password": hash_password("test123"),
            "role": "rider"
        },
        {
            "id": "admin-001",
            "name": "Admin User",
            "phone": "7777777777",
            "email": "admin@apnaghr.com",
            "password": hash_password("admin123"),
            "role": "admin"
        },
        {
            "id": "inventory-admin-001",
            "name": "Property Manager",
            "phone": "6666666666",
            "email": "inventory@apnaghr.com",
            "password": hash_password("admin123"),
            "role": "inventory_admin"
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    # Create properties
    properties = [
        {
            "id": "prop-001",
            "title": "Modern 2BHK Apartment in Sector 70",
            "description": "Spacious 2BHK apartment with modern amenities, parking, and 24/7 security.",
            "property_type": "Apartment",
            "bhk": 2,
            "rent": 25000.0,
            "furnishing": "Semi-Furnished",
            "area_name": "Sector 70",
            "city": "Mohali",
            "exact_address": "Block A, Sector 70, Mohali, Punjab 160071",
            "latitude": 30.7046,
            "longitude": 76.7179,
            "images": [
                "https://images.unsplash.com/photo-1772103628874-1b084bdae27b?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.pexels.com/photos/2462015/pexels-photo-2462015.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            ],
            "video_url": "",
            "amenities": ["Parking", "Security", "Gym", "Power Backup"],
            "available": True,
            "verified_owner": True,
            "premium_listing": False
        },
        {
            "id": "prop-002",
            "title": "Luxury 3BHK Villa in Zirakpur",
            "description": "Beautiful 3BHK villa with garden, modern kitchen, and premium fittings.",
            "property_type": "Villa",
            "bhk": 3,
            "rent": 45000.0,
            "furnishing": "Fully-Furnished",
            "area_name": "Zirakpur",
            "city": "Zirakpur",
            "exact_address": "Villa Complex, Zirakpur Highway, Punjab 140603",
            "latitude": 30.6421,
            "longitude": 76.8185,
            "images": [
                "https://images.unsplash.com/photo-1759148955043-2e6cc5b97b81?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.pexels.com/photos/6970070/pexels-photo-6970070.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            ],
            "video_url": "",
            "amenities": ["Garden", "Parking", "Security", "Club House", "Swimming Pool"],
            "available": True,
            "verified_owner": True,
            "premium_listing": True
        },
        {
            "id": "prop-003",
            "title": "Affordable 1BHK in Patiala",
            "description": "Compact and well-maintained 1BHK apartment perfect for singles or couples.",
            "property_type": "Apartment",
            "bhk": 1,
            "rent": 12000.0,
            "furnishing": "Unfurnished",
            "area_name": "Model Town",
            "city": "Patiala",
            "exact_address": "Model Town, Patiala, Punjab 147001",
            "latitude": 30.3398,
            "longitude": 76.3869,
            "images": [
                "https://images.unsplash.com/photo-1639059851892-95c80412298c?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "video_url": "",
            "amenities": ["Parking", "Water Supply"],
            "available": True,
            "verified_owner": False,
            "premium_listing": False
        }
    ]
    
    await db.properties.insert_many(properties)
    print(f"Created {len(properties)} properties")
    
    print("\n=== Seeding Complete ===")
    print("\nDemo Accounts:")
    print("Customer: 9999999999 / test123")
    print("Rider: 8888888888 / test123")
    print("Admin: 7777777777 / admin123")
    print("Inventory Admin: 6666666666 / admin123")
    print("\nPayments are set to test mode with Stripe test keys")

asyncio.run(seed_data())