#!/usr/bin/env python3
"""
Production Data Export Script
Exports all data from production ApnaGhr via API endpoints
"""
import requests
import json
import os
from datetime import datetime

PROD_URL = "https://apnaghrapp.in"
BACKUP_DIR = "/app/production_backup"
os.makedirs(BACKUP_DIR, exist_ok=True)

def login():
    """Login as admin and get token"""
    response = requests.post(
        f"{PROD_URL}/api/auth/login",
        json={"phone": "7777777777", "password": "admin123"},
        timeout=30
    )
    data = response.json()
    if "token" in data:
        print("✅ Admin login successful")
        return data["token"]
    else:
        print(f"❌ Login failed: {data}")
        return None

def export_endpoint(token, endpoint, filename, description):
    """Export data from an API endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(
            f"{PROD_URL}{endpoint}",
            headers=headers,
            timeout=120
        )
        if response.status_code == 200:
            data = response.json()
            filepath = f"{BACKUP_DIR}/{filename}"
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            # Count records
            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict):
                # Try to find the data array in common keys
                for key in ['properties', 'users', 'bookings', 'data', 'items', 'sellers', 'riders']:
                    if key in data:
                        count = len(data[key])
                        break
                else:
                    count = 1  # Single object
            else:
                count = 1
            
            print(f"✅ {description}: {count} records -> {filename}")
            return data
        else:
            print(f"⚠️ {description}: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {description}: {str(e)}")
        return None

def main():
    print("=" * 60)
    print("PRODUCTION DATA EXPORT")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    token = login()
    if not token:
        return
    
    print("\n📦 Exporting collections...\n")
    
    # Core data exports
    endpoints = [
        ("/api/properties", "properties.json", "Properties"),
        ("/api/admin/sellers", "sellers.json", "Sellers"),
        ("/api/admin/riders", "riders.json", "Riders"),
        ("/api/admin/visits", "visits.json", "Visit Bookings"),
        ("/api/admin/manual-visits", "manual_visits.json", "Manual Visits"),
        ("/api/seller-performance/admin/sellers-tracking", "seller_tracking.json", "Seller Tracking"),
        ("/api/seller-performance/admin/leaderboard?period=monthly", "seller_leaderboard.json", "Seller Leaderboard"),
        ("/api/seller-performance/admin/earnings", "seller_earnings.json", "Seller Earnings"),
        ("/api/seller-verification/admin/locked-sellers", "locked_sellers.json", "Locked Sellers"),
        ("/api/inventory/admin/inventory-team", "inventory_sessions.json", "Inventory Sessions"),
        ("/api/admin/rider-applications", "rider_applications.json", "Rider Applications"),
    ]
    
    results = {}
    for endpoint, filename, description in endpoints:
        data = export_endpoint(token, endpoint, filename, description)
        results[filename] = data
    
    # Create summary
    print("\n" + "=" * 60)
    print("EXPORT SUMMARY")
    print("=" * 60)
    
    summary = {
        "export_date": datetime.now().isoformat(),
        "source": PROD_URL,
        "files": []
    }
    
    for filename in os.listdir(BACKUP_DIR):
        if filename.endswith('.json'):
            filepath = f"{BACKUP_DIR}/{filename}"
            size = os.path.getsize(filepath)
            summary["files"].append({
                "filename": filename,
                "size_bytes": size,
                "size_kb": round(size/1024, 2)
            })
            print(f"  {filename}: {round(size/1024, 2)} KB")
    
    with open(f"{BACKUP_DIR}/export_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ Export complete! Files saved to /app/production_backup/")

if __name__ == "__main__":
    main()
