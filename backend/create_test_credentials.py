import certifi
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Password hashing context matches the backend structure
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'apnaghr_visit_db')

async def create_test_credentials():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    # Check if admin user exists, else create
    test_user = {
        "id": "test_admin_001",
        "name": "Test Admin",
        "phone": "9999999999",
        "email": "admin@apnaghr.com",
        "password": pwd_context.hash("Admin@123"),
        "role": "admin",
        "is_online": False
    }
    
    existing = await db.users.find_one({"phone": "9999999999"})
    if existing:
        print("Test admin already exists! Phone: 9999999999, Password: Admin@123")
    else:
        await db.users.insert_one(test_user)
        print("Created Test Admin successfully!")
        print("Phone: 9999999999")
        print("Password: Admin@123")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_credentials())
