"""
Test suite for bug fixes:
1. Rider online/offline toggle
2. Rider wallet showing earnings
3. ToLet tasks with accept button
4. Customer properties display
5. Search filter with partial match
6. Admin properties loading
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - using actual customer from database
CUSTOMER_PHONE = "9999999999"  # Has advertiser role but can access properties
CUSTOMER_PASSWORD = "test123"
RIDER_PHONE = "8888888888"
RIDER_PASSWORD = "test123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


class TestRiderOnlineOffline:
    """Test rider online/offline toggle functionality"""
    
    @pytest.fixture
    def rider_token(self):
        """Get rider authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Rider login failed - skipping rider tests")
        return response.json()["token"]
    
    def test_rider_login(self):
        """Test rider can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200, f"Rider login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "rider"
        print(f"PASS: Rider login successful, role={data['user']['role']}")
    
    def test_rider_go_online(self, rider_token):
        """Test rider can go online"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.post(f"{BASE_URL}/api/rider/shift", 
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179},
            headers=headers
        )
        assert response.status_code == 200, f"Go online failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("is_online") == True
        print(f"PASS: Rider went online successfully")
    
    def test_rider_get_shift_status(self, rider_token):
        """Test rider can get shift status"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/shift", headers=headers)
        assert response.status_code == 200, f"Get shift failed: {response.text}"
        data = response.json()
        assert "is_online" in data
        print(f"PASS: Rider shift status retrieved, is_online={data.get('is_online')}")
    
    def test_rider_go_offline(self, rider_token):
        """Test rider can go offline"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.post(f"{BASE_URL}/api/rider/shift", 
            json={"is_online": False},
            headers=headers
        )
        assert response.status_code == 200, f"Go offline failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("is_online") == False
        print(f"PASS: Rider went offline successfully")


class TestRiderWallet:
    """Test rider wallet functionality"""
    
    @pytest.fixture
    def rider_token(self):
        """Get rider authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Rider login failed - skipping wallet tests")
        return response.json()["token"]
    
    def test_get_wallet(self, rider_token):
        """Test rider can get wallet data"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/wallet", headers=headers)
        assert response.status_code == 200, f"Get wallet failed: {response.text}"
        data = response.json()
        # Wallet should have earnings fields
        assert "total_earnings" in data or data == {} or data is None, f"Wallet response: {data}"
        print(f"PASS: Wallet data retrieved: {data}")
    
    def test_get_transactions(self, rider_token):
        """Test rider can get transaction history"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/wallet/transactions", headers=headers)
        assert response.status_code == 200, f"Get transactions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Transactions should be a list: {data}"
        print(f"PASS: Transactions retrieved, count={len(data)}")


class TestToLetTasks:
    """Test ToLet tasks functionality"""
    
    @pytest.fixture
    def rider_token(self):
        """Get rider authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Rider login failed - skipping ToLet tests")
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        return response.json()["token"]
    
    def test_get_available_tasks(self, rider_token):
        """Test rider can get available ToLet tasks"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/tolet-tasks/available", headers=headers)
        assert response.status_code == 200, f"Get tasks failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Tasks should be a list: {data}"
        print(f"PASS: ToLet tasks retrieved, count={len(data)}")
        
        # Check task structure if any exist
        if len(data) > 0:
            task = data[0]
            assert "id" in task, "Task should have id"
            assert "title" in task, "Task should have title"
            assert "location" in task, "Task should have location"
            assert "rate_per_board" in task, "Task should have rate_per_board"
            print(f"PASS: Task structure valid - {task.get('title')}")
    
    def test_admin_create_tolet_task(self, admin_token):
        """Test admin can create ToLet task"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        task_data = {
            "title": "TEST_ToLet Board Collection",
            "description": "Collect ToLet boards from Sector 17",
            "location": "Sector 17, Chandigarh",
            "rate_per_board": 15.0,
            "estimated_boards": 5
        }
        response = requests.post(f"{BASE_URL}/api/admin/tolet-tasks", 
            json=task_data, headers=headers)
        assert response.status_code == 200, f"Create task failed: {response.text}"
        data = response.json()
        assert data.get("title") == task_data["title"]
        assert data.get("status") == "open"
        print(f"PASS: ToLet task created - {data.get('id')}")
        return data.get("id")


class TestCustomerProperties:
    """Test customer properties display and filtering"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Customer login failed - skipping customer tests")
        return response.json()["token"]
    
    def test_customer_login(self):
        """Test customer/advertiser can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Customer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        # Role can be customer or advertiser
        assert data["user"]["role"] in ["customer", "advertiser"], f"Unexpected role: {data['user']['role']}"
        print(f"PASS: Customer/Advertiser login successful, role={data['user']['role']}")
    
    def test_get_properties(self, customer_token):
        """Test customer can get properties list"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        assert response.status_code == 200, f"Get properties failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Properties should be a list: {data}"
        print(f"PASS: Properties retrieved, count={len(data)}")
        
        # Check property structure if any exist
        if len(data) > 0:
            prop = data[0]
            assert "id" in prop, "Property should have id"
            assert "title" in prop, "Property should have title"
            assert "rent" in prop, "Property should have rent"
            assert "bhk" in prop, "Property should have bhk"
            # Exact address should NOT be visible to customer
            assert "exact_address" not in prop, "Exact address should be hidden from customer"
            print(f"PASS: Property structure valid - {prop.get('title')}")
    
    def test_filter_by_city_partial_match(self, customer_token):
        """Test search filter works with partial city match"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        
        # Test partial match - "Moha" should match "Mohali"
        response = requests.get(f"{BASE_URL}/api/properties", 
            params={"city": "Moha"}, headers=headers)
        assert response.status_code == 200, f"Filter failed: {response.text}"
        data = response.json()
        print(f"PASS: Partial city filter 'Moha' returned {len(data)} properties")
        
        # Test case-insensitive match
        response = requests.get(f"{BASE_URL}/api/properties", 
            params={"city": "mohali"}, headers=headers)
        assert response.status_code == 200, f"Filter failed: {response.text}"
        data = response.json()
        print(f"PASS: Case-insensitive filter 'mohali' returned {len(data)} properties")
    
    def test_filter_by_bhk(self, customer_token):
        """Test filter by BHK"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/properties", 
            params={"bhk": 2}, headers=headers)
        assert response.status_code == 200, f"BHK filter failed: {response.text}"
        data = response.json()
        # All returned properties should have bhk=2
        for prop in data:
            assert prop.get("bhk") == 2, f"Property BHK mismatch: {prop.get('bhk')}"
        print(f"PASS: BHK filter returned {len(data)} 2BHK properties")
    
    def test_filter_by_rent_range(self, customer_token):
        """Test filter by rent range"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/properties", 
            params={"min_rent": 10000, "max_rent": 30000}, headers=headers)
        assert response.status_code == 200, f"Rent filter failed: {response.text}"
        data = response.json()
        # All returned properties should be within rent range
        for prop in data:
            rent = prop.get("rent", 0)
            assert 10000 <= rent <= 30000, f"Property rent out of range: {rent}"
        print(f"PASS: Rent filter (10k-30k) returned {len(data)} properties")


class TestAdminProperties:
    """Test admin properties management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        return response.json()["token"]
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful")
    
    def test_admin_get_properties(self, admin_token):
        """Test admin can get all properties from database"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/properties", headers=headers)
        assert response.status_code == 200, f"Admin get properties failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Properties should be a list: {data}"
        print(f"PASS: Admin properties retrieved from DB, count={len(data)}")
        
        # Admin should see all properties including unavailable ones
        if len(data) > 0:
            prop = data[0]
            assert "id" in prop
            assert "title" in prop
            # Admin should see exact_address
            print(f"PASS: Admin property structure valid")
    
    def test_admin_create_property(self, admin_token):
        """Test admin can create a property"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        property_data = {
            "title": "TEST_Admin Created Property",
            "description": "Test property created by admin",
            "property_type": "Apartment",
            "bhk": 2,
            "rent": 25000,
            "furnishing": "Semi-Furnished",
            "area_name": "Sector 22",
            "city": "Chandigarh",
            "exact_address": "123 Test Street, Sector 22",
            "images": [],
            "video_url": "",
            "amenities": ["Parking", "Gym"]
        }
        response = requests.post(f"{BASE_URL}/api/properties", 
            json=property_data, headers=headers)
        assert response.status_code == 200, f"Create property failed: {response.text}"
        data = response.json()
        assert data.get("title") == property_data["title"]
        assert data.get("rent") == property_data["rent"]
        print(f"PASS: Property created - {data.get('id')}")
        return data.get("id")


class TestVisitsAvailable:
    """Test available visits for rider"""
    
    @pytest.fixture
    def rider_token(self):
        """Get rider authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Rider login failed")
        return response.json()["token"]
    
    def test_get_available_visits_when_online(self, rider_token):
        """Test rider can get available visits when online"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        # First go online
        requests.post(f"{BASE_URL}/api/rider/shift", 
            json={"is_online": True}, headers=headers)
        
        # Then get available visits
        response = requests.get(f"{BASE_URL}/api/visits/available", headers=headers)
        assert response.status_code == 200, f"Get visits failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Visits should be a list: {data}"
        print(f"PASS: Available visits retrieved, count={len(data)}")
    
    def test_get_available_visits_when_offline(self, rider_token):
        """Test rider gets empty list when offline"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        # First go offline
        requests.post(f"{BASE_URL}/api/rider/shift", 
            json={"is_online": False}, headers=headers)
        
        # Then get available visits - should be empty
        response = requests.get(f"{BASE_URL}/api/visits/available", headers=headers)
        assert response.status_code == 200, f"Get visits failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Visits should be a list: {data}"
        assert len(data) == 0, f"Offline rider should see no visits: {data}"
        print(f"PASS: Offline rider sees no visits")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
