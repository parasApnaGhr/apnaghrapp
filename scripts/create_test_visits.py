import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_test_visits():
    print("🚀 Creating test visits for rider...")
    
    # Get a rider
    riders = await db.riders.find({}, {"_id": 0}).to_list(10)
    if not riders:
        print("❌ No riders found! Please create a rider first.")
        return
    
    rider = riders[0]
    print(f"✅ Found rider: {rider['id']}")
    
    # Get some properties
    properties = await db.properties.find({"available": True}, {"_id": 0}).to_list(10)
    if len(properties) < 3:
        print("❌ Need at least 3 properties! Please add more properties.")
        return
    
    print(f"✅ Found {len(properties)} available properties")
    
    # Get customer
    customer = await db.users.find_one({"role": "customer"}, {"_id": 0})
    if not customer:
        print("❌ No customer found!")
        return
    
    print(f"✅ Found customer: {customer['name']}")
    
    # Create 3 test visits
    test_visits = [
        {
            "id": f"test-visit-001",
            "customer_id": customer['id'],
            "property_id": properties[0]['id'],
            "scheduled_date": "2024-03-27",
            "scheduled_time": "10:00 AM",
            "status": "pending",
            "rider_id": None,
            "otp": "123456",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test-visit-002",
            "customer_id": customer['id'],
            "property_id": properties[1]['id'],
            "scheduled_date": "2024-03-27",
            "scheduled_time": "02:00 PM",
            "status": "pending",
            "rider_id": None,
            "otp": "789012",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test-visit-003",
            "customer_id": customer['id'],
            "property_id": properties[2]['id'],
            "scheduled_date": "2024-03-27",
            "scheduled_time": "04:30 PM",
            "status": "pending",
            "rider_id": None,
            "otp": "345678",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Delete old test visits
    await db.visit_bookings.delete_many({"id": {"$regex": "^test-visit-"}})
    
    # Insert new visits
    await db.visit_bookings.insert_many(test_visits)
    
    print("\n✅ ✅ ✅ Created 3 test visits!\n")
    print("=" * 60)
    print("📋 TEST VISITS CREATED:")
    print("=" * 60)
    
    for i, visit in enumerate(test_visits, 1):
        prop = next(p for p in properties if p['id'] == visit['property_id'])
        print(f"\n🏠 Visit {i}:")
        print(f"   ID: {visit['id']}")
        print(f"   Property: {prop['title']}")
        print(f"   Location: {prop['area_name']}, {prop['city']}")
        print(f"   Rent: ₹{prop['rent']}")
        print(f"   Time: {visit['scheduled_date']} at {visit['scheduled_time']}")
        print(f"   OTP: {visit['otp']}")
        print(f"   Customer: {customer['name']} ({customer['phone']})")
    
    print("\n" + "=" * 60)
    print("🎯 HOW TO TEST:")
    print("=" * 60)
    print("1. Login as Rider: 8888888888 / test123")
    print("2. Go to Rider Dashboard")
    print("3. You should see 3 available visits")
    print("4. Click 'Accept Visit' on any one")
    print("5. Use the OTP shown above to verify")
    print("6. Upload visit proof (selfie + video)")
    print("7. Complete the visit")
    print("\n💡 Note: All 3 visits are set to 'pending' status")
    print("   They will appear in 'Available Visits' section")
    print("=" * 60)

asyncio.run(create_test_visits())
