import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def setup_complete_test():
    print("🚀 Setting up complete test environment...")
    
    # 1. Ensure we have a rider user
    rider_user = await db.users.find_one({"phone": "8888888888"}, {"_id": 0})
    if not rider_user:
        print("Creating rider user...")
        rider_user = {
            "id": f"rider-user-{str(uuid.uuid4())[:8]}",
            "name": "Test Rider",
            "phone": "8888888888",
            "password": hash_password("test123"),
            "role": "rider",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(rider_user)
        print("✅ Rider user created")
    else:
        print("✅ Rider user exists")
    
    # 2. Create/update rider profile
    rider_profile = await db.riders.find_one({"user_id": rider_user['id']}, {"_id": 0})
    if not rider_profile:
        print("Creating rider profile...")
        rider_profile = {
            "id": f"rider-profile-{str(uuid.uuid4())[:8]}",
            "user_id": rider_user['id'],
            "city": "Mohali",
            "vehicle_type": "bike",
            "on_duty": False,
            "duty_start_time": None,
            "km_today": 0.0,
            "current_lat": 30.7046,
            "current_lng": 76.7179,
            "last_location_update": datetime.now(timezone.utc).isoformat()
        }
        await db.riders.insert_one(rider_profile)
        print("✅ Rider profile created")
    else:
        print("✅ Rider profile exists")
    
    # 3. Ensure we have a customer
    customer = await db.users.find_one({"phone": "9999999999"}, {"_id": 0})
    if not customer:
        print("❌ Customer not found! Run main seed script first.")
        return
    print("✅ Customer found")
    
    # 4. Get properties
    properties = await db.properties.find({"available": True}, {"_id": 0}).to_list(10)
    if len(properties) < 3:
        print("❌ Need at least 3 properties! Add more properties first.")
        return
    print(f"✅ Found {len(properties)} properties")
    
    # 5. Create 3 test visits
    test_visits = [
        {
            "id": f"visit-{str(uuid.uuid4())[:8]}",
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
            "id": f"visit-{str(uuid.uuid4())[:8]}",
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
            "id": f"visit-{str(uuid.uuid4())[:8]}",
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
    
    # Delete old visits to avoid duplicates
    await db.visit_bookings.delete_many({})
    
    # Insert new visits
    result = await db.visit_bookings.insert_many(test_visits)
    
    print("\n" + "=" * 70)
    print("✅ ✅ ✅ TEST ENVIRONMENT READY!")
    print("=" * 70)
    print(f"\n📊 SETUP SUMMARY:")
    print(f"   • Rider User: {rider_user['name']} ({rider_user['phone']})")
    print(f"   • Customer: {customer['name']} ({customer['phone']})")
    print(f"   • Properties: {len(properties)} available")
    print(f"   • Test Visits: 3 created")
    
    print("\n" + "=" * 70)
    print("📋 TEST VISITS:")
    print("=" * 70)
    
    for i, visit in enumerate(test_visits, 1):
        prop = next(p for p in properties if p['id'] == visit['property_id'])
        print(f"\n🏠 Visit {i} - {visit['id']}")
        print(f"   Property: {prop['title']}")
        print(f"   Location: {prop['area_name']}, {prop['city']}")
        print(f"   Rent: ₹{int(prop['rent'])}/month")
        print(f"   Scheduled: {visit['scheduled_date']} at {visit['scheduled_time']}")
        print(f"   OTP: {visit['otp']}")
        print(f"   Status: {visit['status']}")
    
    print("\n" + "=" * 70)
    print("🧪 TESTING STEPS:")
    print("=" * 70)
    print("1. Open: https://field-rider-ops.preview.emergentagent.com")
    print("2. Login as Rider:")
    print("   📱 Phone: 8888888888")
    print("   🔒 Password: test123")
    print("\n3. You should see 3 visits in 'Available Visits' section")
    print("\n4. Test accepting a visit:")
    print("   • Click 'Accept Visit' button")
    print("   • System will assign it to you")
    print("   • Property details will be revealed")
    print("   • Use OTP to verify with customer")
    print("\n5. Test upload proof:")
    print("   • Click 'Upload Proof'")
    print("   • Take/upload selfie with customer")
    print("   • Record/upload property video")
    print("   • Submit proof")
    print("\n6. Complete visit and check earnings")
    print("=" * 70)
    print("\n💡 TIP: Login as Customer (9999999999 / test123) to see bookings")
    print("💡 TIP: Login as Admin (7777777777 / admin123) to track everything")
    print("=" * 70)

asyncio.run(setup_complete_test())
