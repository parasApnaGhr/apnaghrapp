#!/usr/bin/env python3
"""
Complete Production Data Export and Atlas Import Script
"""
import requests
import json
import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

PROD_URL = "https://apnaghrapp.in"
BACKUP_DIR = "/app/production_backup"
ATLAS_URI = "mongodb+srv://aamamjot441_db_user:50jRNNRJwz6QHIhm@apnaghr-cluster.ysgyiah.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "apnaghr_visit_db"

os.makedirs(BACKUP_DIR, exist_ok=True)

def login(phone, password):
    """Login and get token"""
    response = requests.post(
        f"{PROD_URL}/api/auth/login",
        json={"phone": phone, "password": password},
        timeout=30
    )
    data = response.json()
    return data.get("token")

def export_endpoint(token, endpoint, filename):
    """Export data from an API endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{PROD_URL}{endpoint}", headers=headers, timeout=120)
        if response.status_code == 200:
            data = response.json()
            filepath = f"{BACKUP_DIR}/{filename}"
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            count = len(data) if isinstance(data, list) else 1
            return data, count
        return None, 0
    except Exception as e:
        print(f"  Error: {e}")
        return None, 0

def export_all_data():
    """Export all production data via APIs"""
    print("=" * 60)
    print("STEP 1: EXPORTING PRODUCTION DATA")
    print("=" * 60)
    
    admin_token = login("7777777777", "admin123")
    if not admin_token:
        print("❌ Admin login failed!")
        return False
    print("✅ Admin login successful")
    
    # Get all seller tokens for their data
    seller_phones = ["7347383375", "9780179766"]  # Known sellers
    seller_tokens = []
    for phone in seller_phones:
        try:
            token = login(phone, "Mudit@123" if phone == "7347383375" else "Piyush@123")
            if token:
                seller_tokens.append((phone, token))
        except:
            pass
    
    print(f"\n📦 Exporting {len(seller_tokens) + 1} user sessions...")
    
    exports = {}
    
    # Admin exports
    admin_endpoints = [
        ("/api/properties", "properties.json"),
        ("/api/users", "users.json"),
        ("/api/admin/sellers", "sellers.json"),
        ("/api/admin/riders", "riders.json"),
        ("/api/admin/manual-visits", "manual_visits.json"),
        ("/api/seller-performance/admin/sellers-tracking", "seller_tracking.json"),
        ("/api/seller-performance/admin/earnings", "seller_earnings.json"),
        ("/api/seller-verification/admin/locked-sellers", "locked_sellers.json"),
        ("/api/inventory/admin/inventory-team", "inventory_sessions.json"),
        ("/api/admin/rider-applications", "rider_applications.json"),
        ("/api/packers/admin/bookings", "packers_bookings.json"),
        ("/api/advertising/admin/ads", "ads.json"),
        ("/api/builder/admin/all", "builder_projects.json"),
    ]
    
    for endpoint, filename in admin_endpoints:
        data, count = export_endpoint(admin_token, endpoint, filename)
        name = filename.replace('.json', '')
        if data is not None:
            exports[name] = count
            print(f"  ✅ {name}: {count} records")
        else:
            print(f"  ⚠️ {name}: Failed or empty")
    
    # Export seller followups from each seller
    all_followups = []
    for phone, token in seller_tokens:
        data, _ = export_endpoint(token, "/api/seller/followups", f"temp_{phone}.json")
        if data and 'followups' in data:
            for f in data['followups']:
                f['_source_phone'] = phone
            all_followups.extend(data['followups'])
    
    # Save combined followups
    with open(f"{BACKUP_DIR}/seller_followups.json", 'w') as f:
        json.dump(all_followups, f, indent=2, default=str)
    exports['seller_followups'] = len(all_followups)
    print(f"  ✅ seller_followups: {len(all_followups)} records")
    
    # Clean up temp files
    for phone, _ in seller_tokens:
        temp_file = f"{BACKUP_DIR}/temp_{phone}.json"
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    print(f"\n📊 Export Summary:")
    total = sum(exports.values())
    for name, count in exports.items():
        print(f"  {name}: {count}")
    print(f"  TOTAL: {total} records")
    
    return True

async def import_to_atlas():
    """Import exported data to MongoDB Atlas"""
    print("\n" + "=" * 60)
    print("STEP 2: IMPORTING TO MONGODB ATLAS")
    print("=" * 60)
    
    try:
        client = AsyncIOMotorClient(ATLAS_URI, serverSelectionTimeoutMS=10000)
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"❌ Failed to connect to Atlas: {e}")
        return False
    
    db = client[DB_NAME]
    
    # Define collection mappings
    file_to_collection = {
        "properties.json": "properties",
        "users.json": "users",
        "sellers.json": None,  # Sellers are in users collection
        "riders.json": None,   # Riders are in users collection
        "manual_visits.json": "visit_bookings",
        "seller_tracking.json": "seller_daily_activity",
        "seller_earnings.json": "seller_earnings",
        "locked_sellers.json": "seller_account_locks",
        "inventory_sessions.json": "inventory_sessions",
        "rider_applications.json": "rider_applications",
        "packers_bookings.json": "packers_bookings",
        "ads.json": "advertiser_ads",
        "builder_projects.json": "builder_projects",
        "seller_followups.json": "seller_followups",
    }
    
    import_stats = {}
    
    for filename, collection_name in file_to_collection.items():
        if collection_name is None:
            continue
            
        filepath = f"{BACKUP_DIR}/{filename}"
        if not os.path.exists(filepath):
            print(f"  ⚠️ Skipping {filename} (not found)")
            continue
        
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            # Handle different data structures
            if isinstance(data, dict):
                if 'sessions' in data:
                    records = data['sessions']
                elif 'earnings' in data:
                    records = data['earnings']
                elif 'locked_sellers' in data:
                    records = data['locked_sellers']
                else:
                    records = [data]
            else:
                records = data
            
            if not records:
                print(f"  ⚠️ {collection_name}: Empty")
                continue
            
            # Remove _source_phone helper field
            for r in records:
                if isinstance(r, dict) and '_source_phone' in r:
                    del r['_source_phone']
            
            # Drop existing and insert new
            collection = db[collection_name]
            await collection.drop()
            
            if records:
                result = await collection.insert_many(records)
                count = len(result.inserted_ids)
                import_stats[collection_name] = count
                print(f"  ✅ {collection_name}: {count} records imported")
        
        except Exception as e:
            print(f"  ❌ {collection_name}: Error - {e}")
    
    # Create indexes
    print("\n📇 Creating indexes...")
    try:
        await db.users.create_index("id", unique=True)
        await db.users.create_index("phone", unique=True)
        await db.properties.create_index("id", unique=True)
        await db.visit_bookings.create_index("id", unique=True)
        await db.seller_followups.create_index("id", unique=True)
        print("  ✅ Indexes created")
    except Exception as e:
        print(f"  ⚠️ Index creation: {e}")
    
    client.close()
    
    print(f"\n📊 Import Summary:")
    total = sum(import_stats.values())
    for name, count in import_stats.items():
        print(f"  {name}: {count}")
    print(f"  TOTAL: {total} records imported to Atlas")
    
    return True

async def verify_atlas_data():
    """Verify data in Atlas"""
    print("\n" + "=" * 60)
    print("STEP 3: VERIFYING ATLAS DATA")
    print("=" * 60)
    
    client = AsyncIOMotorClient(ATLAS_URI)
    db = client[DB_NAME]
    
    collections = ['users', 'properties', 'visit_bookings', 'seller_followups', 
                   'inventory_sessions', 'seller_daily_activity']
    
    for col_name in collections:
        try:
            count = await db[col_name].count_documents({})
            sample = await db[col_name].find_one({}, {"_id": 0})
            sample_keys = list(sample.keys())[:5] if sample else []
            print(f"  ✅ {col_name}: {count} docs (fields: {sample_keys}...)")
        except Exception as e:
            print(f"  ⚠️ {col_name}: {e}")
    
    client.close()
    return True

async def main():
    print("\n🚀 PRODUCTION TO ATLAS MIGRATION")
    print(f"   Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Step 1: Export
    if not export_all_data():
        print("❌ Export failed!")
        return
    
    # Step 2: Import
    if not await import_to_atlas():
        print("❌ Import failed!")
        return
    
    # Step 3: Verify
    await verify_atlas_data()
    
    print("\n" + "=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Update /app/backend/.env with Atlas connection string")
    print("2. Restart backend: sudo supervisorctl restart backend")
    print("3. Test the app works with Atlas")

if __name__ == "__main__":
    asyncio.run(main())
