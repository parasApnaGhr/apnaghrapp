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
    print("Starting data seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.riders.delete_many({})
    await db.site_visits.delete_many({})
    await db.tolet_boards.delete_many({})
    await db.broker_visits.delete_many({})
    await db.notifications.delete_many({})
    
    print("Cleared existing data")
    
    # Create users
    users = [
        {
            "id": "admin-001",
            "name": "Admin User",
            "phone": "9999999999",
            "password": hash_password("admin123"),
            "role": "admin",
            "city": None
        },
        {
            "id": "cm-mohali-001",
            "name": "Mohali Manager",
            "phone": "9999999998",
            "password": hash_password("manager123"),
            "role": "city_manager",
            "city": "Mohali"
        },
        {
            "id": "cm-patiala-001",
            "name": "Patiala Manager",
            "phone": "9999999997",
            "password": hash_password("manager123"),
            "role": "city_manager",
            "city": "Patiala"
        },
        {
            "id": "cc-001",
            "name": "Call Center Agent",
            "phone": "9999999996",
            "password": hash_password("callcenter123"),
            "role": "call_center",
            "city": "Mohali"
        },
        {
            "id": "rider-aman",
            "name": "Aman Singh",
            "phone": "9999999991",
            "password": hash_password("rider123"),
            "role": "rider",
            "city": "Mohali"
        },
        {
            "id": "rider-rahul",
            "name": "Rahul Kumar",
            "phone": "9999999992",
            "password": hash_password("rider123"),
            "role": "rider",
            "city": "Mohali"
        },
        {
            "id": "rider-vikas",
            "name": "Vikas Sharma",
            "phone": "9999999993",
            "password": hash_password("rider123"),
            "role": "rider",
            "city": "Patiala"
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    # Create riders
    riders = [
        {
            "id": "rider-data-aman",
            "user_id": "rider-aman",
            "city": "Mohali",
            "vehicle_type": "bike",
            "on_duty": False,
            "duty_start_time": None,
            "km_today": 0.0,
            "current_lat": 30.7046,
            "current_lng": 76.7179,
            "last_location_update": None
        },
        {
            "id": "rider-data-rahul",
            "user_id": "rider-rahul",
            "city": "Mohali",
            "vehicle_type": "bike",
            "on_duty": True,
            "duty_start_time": None,
            "km_today": 12.5,
            "current_lat": 30.7333,
            "current_lng": 76.7794,
            "last_location_update": None
        },
        {
            "id": "rider-data-vikas",
            "user_id": "rider-vikas",
            "city": "Patiala",
            "vehicle_type": "bike",
            "on_duty": True,
            "duty_start_time": None,
            "km_today": 8.0,
            "current_lat": 30.3398,
            "current_lng": 76.3869,
            "last_location_update": None
        }
    ]
    
    await db.riders.insert_many(riders)
    print(f"Created {len(riders)} riders")
    
    # Create sample site visits
    site_visits = [
        {
            "id": "visit-001",
            "client_name": "Neha Gupta",
            "property_address": "Sector 70, Mohali",
            "property_type": "3BHK",
            "scheduled_time": "14:00",
            "assigned_rider_id": "rider-data-aman",
            "status": "pending",
            "feedback": None,
            "city": "Mohali",
            "created_at": "2024-01-15T10:00:00Z",
            "completed_at": None
        },
        {
            "id": "visit-002",
            "client_name": "Rajesh Kumar",
            "property_address": "Zirakpur Highway",
            "property_type": "2BHK",
            "scheduled_time": "16:30",
            "assigned_rider_id": "rider-data-rahul",
            "status": "pending",
            "feedback": None,
            "city": "Mohali",
            "created_at": "2024-01-15T11:00:00Z",
            "completed_at": None
        }
    ]
    
    await db.site_visits.insert_many(site_visits)
    print(f"Created {len(site_visits)} site visits")
    
    # Create sample to-let boards
    boards = [
        {
            "id": "board-001",
            "rider_id": "rider-data-aman",
            "photo_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
            "owner_phone": "9876543210",
            "address": "Phase 7, Mohali",
            "rent_expected": 25000,
            "property_type": "2BHK",
            "city": "Mohali",
            "created_at": "2024-01-15T09:00:00Z"
        },
        {
            "id": "board-002",
            "rider_id": "rider-data-rahul",
            "photo_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
            "owner_phone": "9876543211",
            "address": "Sector 82, Mohali",
            "rent_expected": 18000,
            "property_type": "1BHK",
            "city": "Mohali",
            "created_at": "2024-01-15T10:30:00Z"
        }
    ]
    
    await db.tolet_boards.insert_many(boards)
    print(f"Created {len(boards)} to-let boards")
    
    # Create sample broker visits
    broker_visits = [
        {
            "id": "broker-001",
            "rider_id": "rider-data-aman",
            "broker_name": "Property Solutions",
            "office_location": "Industrial Area, Mohali",
            "phone_number": "9876543220",
            "interest_level": "high",
            "package_sold": True,
            "city": "Mohali",
            "created_at": "2024-01-15T11:00:00Z"
        }
    ]
    
    await db.broker_visits.insert_many(broker_visits)
    print(f"Created {len(broker_visits)} broker visits")
    
    print("\n=== Seeding Complete ===")
    print("\nDemo Accounts:")
    print("Admin: 9999999999 / admin123")
    print("City Manager (Mohali): 9999999998 / manager123")
    print("City Manager (Patiala): 9999999997 / manager123")
    print("Call Center: 9999999996 / callcenter123")
    print("Rider (Aman): 9999999991 / rider123")
    print("Rider (Rahul): 9999999992 / rider123")
    print("Rider (Vikas): 9999999993 / rider123")

asyncio.run(seed_data())
