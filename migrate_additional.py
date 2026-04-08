#!/usr/bin/env python3
"""
Export additional collections from production via direct DB collections query
Since we can't access the production MongoDB directly, we'll use the available API endpoints
for additional data we might have missed.
"""
import requests
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

PROD_URL = "https://apnaghrapp.in"
BACKUP_DIR = "/app/production_backup"
ATLAS_URI = "mongodb+srv://aamamjot441_db_user:50jRNNRJwz6QHIhm@apnaghr-cluster.ysgyiah.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "apnaghr_visit_db"

def login(phone, password):
    response = requests.post(f"{PROD_URL}/api/auth/login", json={"phone": phone, "password": password}, timeout=30)
    return response.json().get("token")

async def export_additional_data():
    """Try to get additional data through APIs"""
    print("=" * 60)
    print("EXPORTING ADDITIONAL DATA")
    print("=" * 60)
    
    admin_token = login("7777777777", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Try to get seller referrals (different from followups)
    print("\n📦 Checking additional endpoints...")
    
    additional_endpoints = [
        ("/api/seller-verification/admin/seller-verification-stats", "seller_verification_stats.json"),
        ("/api/chatbot/admin/sessions", "chat_sessions.json"),
        ("/api/notifications", "notifications.json"),
    ]
    
    for endpoint, filename in additional_endpoints:
        try:
            response = requests.get(f"{PROD_URL}{endpoint}", headers=headers, timeout=60)
            if response.status_code == 200:
                data = response.json()
                with open(f"{BACKUP_DIR}/{filename}", 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                count = len(data) if isinstance(data, list) else 1
                print(f"  ✅ {filename}: {count} records")
            else:
                print(f"  ⚠️ {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ {endpoint}: {e}")
    
    # Get customer data - try to get visit history
    print("\n📦 Getting customer visit history...")
    customer_token = login("7696046257", "naveen@001")
    if customer_token:
        try:
            response = requests.get(f"{PROD_URL}/api/customer/my-bookings", 
                                   headers={"Authorization": f"Bearer {customer_token}"}, 
                                   timeout=60)
            if response.status_code == 200:
                data = response.json()
                with open(f"{BACKUP_DIR}/customer_bookings.json", 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                print(f"  ✅ customer_bookings: {len(data) if isinstance(data, list) else 1} records")
        except Exception as e:
            print(f"  ❌ customer_bookings: {e}")
    
    # Now also try to get seller client referrals 
    print("\n📦 Getting seller client referrals...")
    seller_token = login("7347383375", "Mudit@123")
    if seller_token:
        try:
            response = requests.get(f"{PROD_URL}/api/seller-verification/verification-history", 
                                   headers={"Authorization": f"Bearer {seller_token}"}, 
                                   timeout=60)
            if response.status_code == 200:
                data = response.json()
                with open(f"{BACKUP_DIR}/seller_client_referrals.json", 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                count = len(data) if isinstance(data, list) else (len(data.get('referrals', [])) if isinstance(data, dict) else 1)
                print(f"  ✅ seller_client_referrals: {count} records")
        except Exception as e:
            print(f"  ❌ seller_client_referrals: {e}")

async def import_additional_to_atlas():
    """Import additional collections to Atlas"""
    print("\n" + "=" * 60)
    print("IMPORTING ADDITIONAL DATA TO ATLAS")
    print("=" * 60)
    
    client = AsyncIOMotorClient(ATLAS_URI)
    db = client[DB_NAME]
    
    # Check files and import
    additional_files = [
        ("seller_client_referrals.json", "seller_client_referrals"),
        ("customer_bookings.json", None),  # These are visit_bookings, might be duplicates
        ("notifications.json", "notifications"),
        ("chat_sessions.json", "chat_sessions"),
    ]
    
    for filename, collection_name in additional_files:
        if collection_name is None:
            continue
            
        filepath = f"{BACKUP_DIR}/{filename}"
        if not os.path.exists(filepath):
            continue
        
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            if isinstance(data, dict):
                if 'referrals' in data:
                    records = data['referrals']
                else:
                    records = [data]
            else:
                records = data
            
            if not records:
                continue
            
            collection = db[collection_name]
            existing = await collection.count_documents({})
            if existing == 0 and records:
                result = await collection.insert_many(records)
                print(f"  ✅ {collection_name}: {len(result.inserted_ids)} records")
        except Exception as e:
            print(f"  ❌ {collection_name}: {e}")
    
    client.close()

import os

async def main():
    await export_additional_data()
    await import_additional_to_atlas()
    print("\n✅ Additional data migration complete!")

if __name__ == "__main__":
    asyncio.run(main())
