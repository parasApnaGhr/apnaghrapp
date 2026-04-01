"""
Test suite for ApnaGhr Profile Features:
- Customer Profile with wallet stats
- Customer Payment History
- Rider Profile with bank account management
- Visit modification for admin-created visits
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "7696046257"
CUSTOMER_PASSWORD = "paras123"
RIDER_PHONE = "9915413810"
RIDER_PASSWORD = "paras123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


class TestCustomerProfile:
    """Customer profile and wallet tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as customer before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as customer
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Customer login failed: {response.text}")
        
        token = response.json().get('token')
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.user = response.json().get('user')
    
    def test_get_customer_wallet(self):
        """Test GET /api/customer/wallet returns stats"""
        response = self.session.get(f"{BASE_URL}/api/customer/wallet")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert 'total_visits' in data, "Missing total_visits in response"
        assert 'total_spent' in data, "Missing total_spent in response"
        assert 'properties_viewed' in data, "Missing properties_viewed in response"
        assert 'visits_available' in data, "Missing visits_available in response"
        
        # Verify data types
        assert isinstance(data['total_visits'], int), "total_visits should be int"
        assert isinstance(data['total_spent'], (int, float)), "total_spent should be numeric"
        assert isinstance(data['properties_viewed'], int), "properties_viewed should be int"
        
        print(f"Customer wallet stats: visits={data['total_visits']}, spent={data['total_spent']}, viewed={data['properties_viewed']}")
    
    def test_get_customer_payments(self):
        """Test GET /api/customer/payments returns payment history"""
        response = self.session.get(f"{BASE_URL}/api/customer/payments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Response should be a list
        assert isinstance(data, list), "Response should be a list of payments"
        
        # If there are payments, verify structure
        if len(data) > 0:
            payment = data[0]
            assert 'user_id' in payment or 'amount' in payment, "Payment should have user_id or amount"
            print(f"Found {len(data)} payment records")
        else:
            print("No payment history found (expected for new user)")
    
    def test_update_customer_profile(self):
        """Test PUT /api/customer/profile updates profile"""
        test_address = f"Test Address {uuid.uuid4().hex[:8]}"
        
        response = self.session.put(f"{BASE_URL}/api/customer/profile", json={
            "address": test_address,
            "address_lat": 30.7046,
            "address_lng": 76.7179
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Update should return success=True"
        assert 'user' in data, "Response should contain updated user"
        
        # Verify the address was updated
        updated_user = data['user']
        assert updated_user.get('address') == test_address, "Address should be updated"
        print(f"Profile updated with address: {test_address}")
    
    def test_update_profile_with_location(self):
        """Test profile update with GPS coordinates"""
        response = self.session.put(f"{BASE_URL}/api/customer/profile", json={
            "address": "Sector 17, Chandigarh",
            "address_lat": 30.7412,
            "address_lng": 76.7684
        })
        
        assert response.status_code == 200
        data = response.json()
        
        user = data.get('user', {})
        assert user.get('address_lat') == 30.7412, "Latitude should be saved"
        assert user.get('address_lng') == 76.7684, "Longitude should be saved"
        print("Profile updated with GPS coordinates")


class TestRiderProfile:
    """Rider profile and bank account tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as rider before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as rider
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Rider login failed: {response.text}")
        
        token = response.json().get('token')
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.user = response.json().get('user')
    
    def test_get_rider_profile(self):
        """Test GET /api/rider/profile returns profile with bank details"""
        response = self.session.get(f"{BASE_URL}/api/rider/profile")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert 'profile' in data, "Response should contain profile"
        assert 'bank_account' in data, "Response should contain bank_account (can be null)"
        
        profile = data['profile']
        assert profile.get('role') == 'rider', "Profile should be for rider"
        print(f"Rider profile: {profile.get('name')}, bank_account: {'Yes' if data['bank_account'] else 'No'}")
    
    def test_update_rider_profile(self):
        """Test PUT /api/rider/profile updates profile"""
        test_vehicle = f"PB10XX{uuid.uuid4().hex[:4].upper()}"
        
        response = self.session.put(f"{BASE_URL}/api/rider/profile", json={
            "vehicle_type": "bike",
            "vehicle_number": test_vehicle
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Update should return success=True"
        
        user = data.get('user', {})
        assert user.get('vehicle_type') == 'bike', "Vehicle type should be updated"
        assert user.get('vehicle_number') == test_vehicle, "Vehicle number should be updated"
        print(f"Rider profile updated: vehicle={test_vehicle}")
    
    def test_add_bank_account(self):
        """Test POST /api/rider/bank-account adds bank details"""
        test_account = f"1234567890{uuid.uuid4().hex[:4]}"
        
        response = self.session.post(f"{BASE_URL}/api/rider/bank-account", json={
            "account_holder_name": "Test Rider",
            "account_number": test_account,
            "ifsc_code": "SBIN0001234",
            "bank_name": "State Bank of India",
            "upi_id": "testrider@upi"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Bank account add should return success=True"
        print(f"Bank account added successfully")
    
    def test_get_bank_account(self):
        """Test GET /api/rider/bank-account returns masked account"""
        response = self.session.get(f"{BASE_URL}/api/rider/bank-account")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        if data:
            # Verify masked account number
            assert 'account_number_masked' in data, "Should have masked account number"
            assert data['account_number_masked'].startswith('XXXX'), "Account should be masked"
            assert 'bank_name' in data, "Should have bank name"
            print(f"Bank account: {data['bank_name']} - {data['account_number_masked']}")
        else:
            print("No bank account found (may need to add one first)")
    
    def test_rider_profile_access_denied_for_customer(self):
        """Test that customer cannot access rider profile endpoints"""
        # Login as customer
        customer_session = requests.Session()
        customer_session.headers.update({"Content-Type": "application/json"})
        
        response = customer_session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip("Customer login failed")
        
        token = response.json().get('token')
        customer_session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Try to access rider profile
        response = customer_session.get(f"{BASE_URL}/api/rider/profile")
        assert response.status_code == 403, f"Customer should not access rider profile, got {response.status_code}"
        print("Access correctly denied for customer trying to access rider profile")


class TestVisitModification:
    """Test customer visit modification for admin-created visits"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as customer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Customer login failed: {response.text}")
        
        token = response.json().get('token')
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_get_my_bookings(self):
        """Test GET /api/visits/my-bookings returns customer visits"""
        response = self.session.get(f"{BASE_URL}/api/visits/my-bookings")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of bookings"
        print(f"Found {len(data)} bookings for customer")
        
        # Store a pending visit ID for modification test
        self.pending_visit = None
        for visit in data:
            if visit.get('status') in ['pending', 'confirmed', 'assigned']:
                self.pending_visit = visit
                break
        
        return data
    
    def test_modify_visit_invalid_id(self):
        """Test modifying non-existent visit returns 404"""
        response = self.session.put(f"{BASE_URL}/api/customer/visits/invalid-id-12345/modify", json={
            "scheduled_date": "2026-02-15",
            "scheduled_time": "10:00 AM"
        })
        
        assert response.status_code == 404, f"Expected 404 for invalid visit, got {response.status_code}"
        print("Correctly returned 404 for invalid visit ID")


class TestNotifications:
    """Test notifications endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as customer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Customer login failed: {response.text}")
        
        token = response.json().get('token')
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_get_notifications(self):
        """Test GET /api/notifications returns notifications list"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'notifications' in data, "Response should contain notifications"
        assert 'unread_count' in data, "Response should contain unread_count"
        
        print(f"Notifications: {len(data['notifications'])}, unread: {data['unread_count']}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        
        data = response.json()
        assert data.get('status') == 'healthy', "API should be healthy"
        assert data.get('database') == 'connected', "Database should be connected"
        print(f"API Health: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
