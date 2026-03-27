import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def setup_complete_test():
    print("🚀 Setting up complete test environment for Multi-Property Visits...")
    
    # 1. Create/ensure customer exists
    customer = await db.users.find_one({"phone": "9999999999"}, {"_id": 0})
    if not customer:
        print("Creating customer...")
        customer = {
            "id": f"customer-{str(uuid.uuid4())[:8]}",
            "name": "Test Customer",
            "phone": "9999999999",
            "password": hash_password("test123"),
            "role": "customer",
            "is_online": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(customer)
        print("✅ Customer created")
    else:
        print("✅ Customer exists")
    
    # 2. Create/ensure rider exists (with online capability)
    rider = await db.users.find_one({"phone": "8888888888"}, {"_id": 0})
    if not rider:
        print("Creating rider...")
        rider = {
            "id": f"rider-{str(uuid.uuid4())[:8]}",
            "name": "Test Rider",
            "phone": "8888888888",
            "password": hash_password("test123"),
            "role": "rider",
            "is_online": True,  # Start online for testing
            "current_lat": 30.7046,
            "current_lng": 76.7179,
            "last_location_update": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(rider)
        print("✅ Rider created (online)")
    else:
        # Make sure rider is online
        await db.users.update_one(
            {"phone": "8888888888"},
            {"$set": {"is_online": True}}
        )
        print("✅ Rider exists (set to online)")
    
    # 3. Create/ensure admin exists
    admin = await db.users.find_one({"phone": "7777777777"}, {"_id": 0})
    if not admin:
        print("Creating admin...")
        admin = {
            "id": f"admin-{str(uuid.uuid4())[:8]}",
            "name": "Test Admin",
            "phone": "7777777777",
            "password": hash_password("admin123"),
            "role": "admin",
            "is_online": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        print("✅ Admin created")
    else:
        print("✅ Admin exists")
    
    # 4. Create test properties
    properties = await db.properties.find({"available": True}, {"_id": 0}).to_list(10)
    if len(properties) < 5:
        print("Creating test properties...")
        test_properties = [
            {
                "id": f"prop-{str(uuid.uuid4())[:8]}",
                "title": "Luxury 3BHK in Sector 17",
                "description": "Spacious apartment with modern amenities",
                "property_type": "Apartment",
                "bhk": 3,
                "rent": 35000,
                "furnishing": "Fully-Furnished",
                "area_name": "Sector 17",
                "city": "Chandigarh",
                "exact_address": "123 Main Street, Sector 17, Chandigarh",
                "latitude": 30.7413,
                "longitude": 76.7832,
                "images": [],
                "amenities": ["Parking", "Gym", "Swimming Pool"],
                "available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"prop-{str(uuid.uuid4())[:8]}",
                "title": "Cozy 2BHK Near IT Park",
                "description": "Perfect for working professionals",
                "property_type": "Apartment",
                "bhk": 2,
                "rent": 22000,
                "furnishing": "Semi-Furnished",
                "area_name": "IT Park",
                "city": "Mohali",
                "exact_address": "456 Tech Avenue, IT Park, Mohali",
                "latitude": 30.7046,
                "longitude": 76.7179,
                "images": [],
                "amenities": ["Parking", "Security"],
                "available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"prop-{str(uuid.uuid4())[:8]}",
                "title": "Modern 1BHK Studio",
                "description": "Ideal for singles and couples",
                "property_type": "Studio",
                "bhk": 1,
                "rent": 15000,
                "furnishing": "Fully-Furnished",
                "area_name": "Phase 7",
                "city": "Mohali",
                "exact_address": "789 Studio Lane, Phase 7, Mohali",
                "latitude": 30.7123,
                "longitude": 76.7234,
                "images": [],
                "amenities": ["WiFi", "AC"],
                "available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"prop-{str(uuid.uuid4())[:8]}",
                "title": "Spacious 4BHK Villa",
                "description": "Family home with garden",
                "property_type": "Villa",
                "bhk": 4,
                "rent": 55000,
                "furnishing": "Semi-Furnished",
                "area_name": "Sector 10",
                "city": "Chandigarh",
                "exact_address": "101 Garden Villa, Sector 10, Chandigarh",
                "latitude": 30.7521,
                "longitude": 76.7912,
                "images": [],
                "amenities": ["Garden", "Parking", "Security", "Power Backup"],
                "available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": f"prop-{str(uuid.uuid4())[:8]}",
                "title": "Budget 2BHK Flat",
                "description": "Affordable living space",
                "property_type": "Apartment",
                "bhk": 2,
                "rent": 12000,
                "furnishing": "Unfurnished",
                "area_name": "Phase 3B2",
                "city": "Mohali",
                "exact_address": "202 Budget Apartments, Phase 3B2, Mohali",
                "latitude": 30.6912,
                "longitude": 76.7089,
                "images": [],
                "amenities": ["Parking"],
                "available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for prop in test_properties:
            await db.properties.insert_one(prop)
        properties = test_properties
        print(f"✅ Created {len(test_properties)} properties")
    else:
        print(f"✅ {len(properties)} properties exist")
    
    # 5. Give customer visit credits
    existing_package = await db.visit_packages.find_one({
        "customer_id": customer['id'],
        "valid_until": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if not existing_package:
        print("Creating visit package for customer...")
        visit_package = {
            "id": f"pkg-{str(uuid.uuid4())[:8]}",
            "customer_id": customer['id'],
            "package_type": "five_visits",
            "total_visits": 5,
            "visits_used": 0,
            "amount_paid": 500.0,
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.visit_packages.insert_one(visit_package)
        print("✅ Visit package created (5 visits)")
    else:
        print(f"✅ Customer has visit package ({existing_package['total_visits'] - existing_package['visits_used']} visits remaining)")
    
    # 6. Create a multi-property test visit
    await db.visit_bookings.delete_many({})  # Clear old visits
    
    # Get first 3 properties for the multi-visit
    prop_ids = [p['id'] for p in properties[:3]]
    
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    
    multi_visit = {
        "id": f"visit-{str(uuid.uuid4())[:8]}",
        "customer_id": customer['id'],
        "property_ids": prop_ids,
        "package_id": existing_package['id'] if existing_package else None,
        "scheduled_date": tomorrow.strftime("%Y-%m-%d"),
        "scheduled_time": "10:00 AM",
        "status": "pending",
        "current_step": "waiting",
        "current_property_index": 0,
        "rider_id": None,
        "otp": "123456",
        "total_properties": 3,
        "estimated_duration": "2h 5m",
        "pickup_location": "Sector 17 Bus Stand, Chandigarh",
        "pickup_lat": 30.7413,
        "pickup_lng": 76.7832,
        "properties_completed": [],
        "property_proofs": {},
        "total_earnings": 300.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.visit_bookings.insert_one(multi_visit)
    
    print("\n" + "=" * 70)
    print("✅ ✅ ✅ MULTI-PROPERTY VISIT TEST ENVIRONMENT READY!")
    print("=" * 70)
    
    print(f"\n📊 SETUP SUMMARY:")
    print(f"   • Customer: {customer['name']} ({customer['phone']}) / test123")
    print(f"   • Rider: Test Rider (8888888888) / test123 [ONLINE]")
    print(f"   • Admin: Test Admin (7777777777) / admin123")
    print(f"   • Properties: {len(properties)} available")
    print(f"   • Multi-Property Visit: 3 properties in 1 visit")
    
    print("\n" + "=" * 70)
    print("📋 MULTI-PROPERTY TEST VISIT:")
    print("=" * 70)
    print(f"\n🚗 Visit ID: {multi_visit['id']}")
    print(f"   OTP: {multi_visit['otp']}")
    print(f"   Pickup: {multi_visit['pickup_location']}")
    print(f"   Date: {multi_visit['scheduled_date']} at {multi_visit['scheduled_time']}")
    print(f"   Duration: {multi_visit['estimated_duration']}")
    print(f"   Rider Earnings: ₹{int(multi_visit['total_earnings'])}")
    
    print("\n   Properties to Visit:")
    for i, prop_id in enumerate(prop_ids, 1):
        prop = next(p for p in properties if p['id'] == prop_id)
        print(f"   {i}. {prop['title']}")
        print(f"      📍 {prop['area_name']}, {prop['city']}")
        print(f"      💰 ₹{int(prop['rent'])}/month")
    
    print("\n" + "=" * 70)
    print("🧪 TESTING FLOW:")
    print("=" * 70)
    print("""
1. LOGIN AS RIDER (8888888888 / test123):
   • Rider starts ONLINE (shift toggle should be green)
   • Should see the 3-property visit in "Available Visits"
   • Click "Accept Visit" to start

2. UBER EATS STYLE NAVIGATION:
   Step 1: "Go to Customer" → Navigate to pickup location
   Step 2: "Arrived at Customer" → Verify OTP: 123456
   Step 3: "Start Tour" → Navigate to Property 1
   Step 4: "Arrived at Property" → View & Upload proof
   Step 5: "Complete Property" → Move to Property 2
   ...repeat for all properties...
   Final: "Complete Visit" → Earnings credited

3. LOGIN AS CUSTOMER (9999999999 / test123):
   • Go to "My Visits" to track progress
   • See live status updates as rider progresses
   • View OTP when rider is assigned

4. LOGIN AS ADMIN (7777777777 / admin123):
   • Rider Management panel shows online riders
   • Track all visits and their status
""")
    print("=" * 70)

asyncio.run(setup_complete_test())
