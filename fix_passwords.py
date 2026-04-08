#!/usr/bin/env python3
"""
Fix user passwords in Atlas
Since API export doesn't include passwords, we need to set them
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

ATLAS_URI = "mongodb+srv://aamamjot441_db_user:50jRNNRJwz6QHIhm@apnaghr-cluster.ysgyiah.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "apnaghr_visit_db"

# Known credentials from test_credentials.md
KNOWN_PASSWORDS = {
    "7777777777": "admin123",      # Admin
    "7696046257": "naveen@001",    # Customer
    "9877704235": "Guri@1234",     # Rider
    "6111222333": "rider123",      # Test Rider
    "9898989898": "seller123",     # Test Seller
    "7347383375": "Mudit@123",     # Seller Mudit
    "9780179766": "Piyush@123",    # Seller Piyush
    "6333444555": "build123",      # Builder
}

# Default password for users without known passwords
DEFAULT_PASSWORD = "ApnaGhr@2026"

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def fix_passwords():
    print("=" * 60)
    print("FIXING USER PASSWORDS IN ATLAS")
    print("=" * 60)
    
    client = AsyncIOMotorClient(ATLAS_URI)
    db = client[DB_NAME]
    
    # Get all users
    users = await db.users.find({}).to_list(None)
    print(f"\nTotal users: {len(users)}")
    
    fixed_count = 0
    for user in users:
        phone = user.get('phone')
        name = user.get('name', 'Unknown')
        role = user.get('role', 'unknown')
        
        # Check if password exists
        if not user.get('password'):
            # Use known password or default
            password = KNOWN_PASSWORDS.get(phone, DEFAULT_PASSWORD)
            hashed = hash_password(password)
            
            # Update user with password
            await db.users.update_one(
                {"id": user['id']},
                {"$set": {"password": hashed}}
            )
            
            pwd_source = "known" if phone in KNOWN_PASSWORDS else "default"
            print(f"  ✅ {name} ({phone}) - {role} - {pwd_source} password set")
            fixed_count += 1
        else:
            print(f"  ⏭️ {name} ({phone}) - already has password")
    
    client.close()
    
    print(f"\n{'=' * 60}")
    print(f"✅ Fixed {fixed_count} user passwords")
    print(f"{'=' * 60}")
    print("\nPassword Reference:")
    print("  - Known users: Use their original passwords")
    print(f"  - Other users: Use default password '{DEFAULT_PASSWORD}'")
    print("\nUsers should be asked to change password on first login.")

if __name__ == "__main__":
    asyncio.run(fix_passwords())
