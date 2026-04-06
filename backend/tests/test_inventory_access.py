"""
Inventory Access Control and Tracking System Tests
Tests for access-type selection, key verification, and inventory user tracking
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"
ADMIN_ACCESS_KEY = "0219"
INVENTORY_ACCESS_KEY = "inventory2024"

# Predefined inventory users
PREDEFINED_USERS = [
    "Rahul Sharma", "Priya Patel", "Amit Kumar", "Neha Singh", "Vikash Gupta",
    "Anjali Verma", "Deepak Yadav", "Pooja Kumari", "Raj Malhotra", "Sunita Devi"
]


class TestInventoryAccessAPIs:
    """Test suite for Inventory Access Control APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        self.inventory_session_id = None
    
    def get_admin_token(self):
        """Login as admin and get token"""
        if self.admin_token:
            return self.admin_token
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.admin_token = data.get("token")
        assert self.admin_token, "No token in login response"
        return self.admin_token
    
    def get_auth_headers(self):
        """Get authorization headers"""
        token = self.get_admin_token()
        return {"Authorization": f"Bearer {token}"}
    
    # ============ ACCESS KEY VERIFICATION TESTS ============
    
    def test_verify_admin_key_success(self):
        """Test admin key verification with correct key"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "admin", "key": ADMIN_ACCESS_KEY}
        )
        
        assert response.status_code == 200, f"Admin key verification failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("access_type") == "admin"
        assert "Full admin access granted" in data.get("message", "")
        print(f"✓ Admin key verification successful: {data}")
    
    def test_verify_admin_key_failure(self):
        """Test admin key verification with wrong key"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "admin", "key": "wrong_key"}
        )
        
        assert response.status_code == 401, f"Expected 401 for wrong admin key, got {response.status_code}"
        data = response.json()
        assert "Invalid admin key" in data.get("detail", "")
        print(f"✓ Admin key rejection working: {data}")
    
    def test_verify_inventory_key_success(self):
        """Test inventory key verification with correct key"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "inventory", "key": INVENTORY_ACCESS_KEY}
        )
        
        assert response.status_code == 200, f"Inventory key verification failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("access_type") == "inventory"
        assert "Inventory access granted" in data.get("message", "")
        print(f"✓ Inventory key verification successful: {data}")
    
    def test_verify_inventory_key_failure(self):
        """Test inventory key verification with wrong key"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "inventory", "key": "wrong_key"}
        )
        
        assert response.status_code == 401, f"Expected 401 for wrong inventory key, got {response.status_code}"
        data = response.json()
        assert "Invalid inventory key" in data.get("detail", "")
        print(f"✓ Inventory key rejection working: {data}")
    
    def test_verify_key_invalid_access_type(self):
        """Test key verification with invalid access type"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "invalid_type", "key": "any_key"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid access type, got {response.status_code}"
        print(f"✓ Invalid access type rejection working")
    
    # ============ PREDEFINED USERS TESTS ============
    
    def test_get_predefined_users(self):
        """Test getting predefined inventory users list"""
        headers = self.get_auth_headers()
        response = self.session.get(
            f"{BASE_URL}/api/inventory/predefined-users",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get predefined users failed: {response.text}"
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
        assert len(data["users"]) > 0
        print(f"✓ Predefined users retrieved: {len(data['users'])} users")
        
        # Check if expected users are present
        for user in ["Rahul Sharma", "Priya Patel"]:
            assert user in data["users"], f"Expected user {user} not found"
        print(f"✓ Expected users found in list")
    
    # ============ AVAILABLE CITIES TESTS ============
    
    def test_get_available_cities(self):
        """Test getting available cities for inventory work plan"""
        headers = self.get_auth_headers()
        response = self.session.get(
            f"{BASE_URL}/api/inventory/available-cities",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get available cities failed: {response.text}"
        data = response.json()
        assert "cities" in data
        assert isinstance(data["cities"], list)
        print(f"✓ Available cities retrieved: {len(data['cities'])} cities")
    
    # ============ INVENTORY LOGIN/LOGOUT TESTS ============
    
    def test_inventory_login_success(self):
        """Test inventory user login with valid data"""
        headers = self.get_auth_headers()
        
        # First get available cities
        cities_response = self.session.get(
            f"{BASE_URL}/api/inventory/available-cities",
            headers=headers
        )
        cities = cities_response.json().get("cities", ["Chandigarh", "Mohali"])[:2]
        
        response = self.session.post(
            f"{BASE_URL}/api/inventory/inventory-login",
            headers=headers,
            json={
                "name": "TEST_Rahul Sharma",  # Using TEST_ prefix for cleanup
                "photo_base64": None,
                "selected_cities": cities,
                "city_targets": {city: 10 for city in cities}
            }
        )
        
        # Note: This might fail if "TEST_Rahul Sharma" is not in predefined list
        # Let's use actual predefined user
        if response.status_code == 400:
            response = self.session.post(
                f"{BASE_URL}/api/inventory/inventory-login",
                headers=headers,
                json={
                    "name": "Rahul Sharma",
                    "photo_base64": None,
                    "selected_cities": cities,
                    "city_targets": {city: 10 for city in cities}
                }
            )
        
        assert response.status_code == 200, f"Inventory login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "session_id" in data
        assert data.get("total_target") == 20  # 10 per city * 2 cities
        self.inventory_session_id = data["session_id"]
        print(f"✓ Inventory login successful: session_id={data['session_id'][:8]}...")
        return data["session_id"]
    
    def test_inventory_login_invalid_user(self):
        """Test inventory login with invalid user name"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/inventory-login",
            headers=headers,
            json={
                "name": "Invalid User Name",
                "photo_base64": None,
                "selected_cities": ["Chandigarh"],
                "city_targets": {"Chandigarh": 10}
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid user, got {response.status_code}"
        data = response.json()
        assert "Invalid user" in data.get("detail", "") or "predefined" in data.get("detail", "").lower()
        print(f"✓ Invalid user rejection working")
    
    # ============ INVENTORY STATS TESTS ============
    
    def test_get_my_inventory_stats(self):
        """Test getting inventory user stats"""
        headers = self.get_auth_headers()
        
        # First create a session
        session_id = self.test_inventory_login_success()
        
        response = self.session.get(
            f"{BASE_URL}/api/inventory/my-inventory-stats?session_id={session_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get inventory stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "session_id" in data
        assert "user_name" in data
        assert "login_time" in data
        assert "selected_cities" in data
        assert "city_targets" in data
        assert "total_target" in data
        assert "properties_added" in data
        assert "points_earned" in data
        assert "achievement_percentage" in data
        assert "performance_status" in data
        assert "is_active" in data
        
        print(f"✓ Inventory stats retrieved: user={data['user_name']}, target={data['total_target']}, added={data['properties_added']}")
        return session_id
    
    def test_get_my_inventory_stats_invalid_session(self):
        """Test getting stats with invalid session ID"""
        headers = self.get_auth_headers()
        response = self.session.get(
            f"{BASE_URL}/api/inventory/my-inventory-stats?session_id=invalid-session-id",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid session, got {response.status_code}"
        print(f"✓ Invalid session rejection working")
    
    # ============ INVENTORY LOGOUT TESTS ============
    
    def test_inventory_logout_success(self):
        """Test inventory user logout"""
        headers = self.get_auth_headers()
        
        # First create a session
        session_id = self.test_inventory_login_success()
        
        # Wait a bit to simulate some work time
        time.sleep(1)
        
        response = self.session.post(
            f"{BASE_URL}/api/inventory/inventory-logout",
            headers=headers,
            json={"session_id": session_id}
        )
        
        assert response.status_code == 200, f"Inventory logout failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "logout_time" in data
        assert "total_active_minutes" in data
        assert "performance_status" in data
        
        print(f"✓ Inventory logout successful: active_minutes={data['total_active_minutes']}, status={data['performance_status']}")
    
    def test_inventory_logout_invalid_session(self):
        """Test logout with invalid session ID"""
        headers = self.get_auth_headers()
        response = self.session.post(
            f"{BASE_URL}/api/inventory/inventory-logout",
            headers=headers,
            json={"session_id": "invalid-session-id"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid session, got {response.status_code}"
        print(f"✓ Invalid session logout rejection working")
    
    def test_inventory_logout_already_ended(self):
        """Test logout on already ended session"""
        headers = self.get_auth_headers()
        
        # Create and end a session
        session_id = self.test_inventory_login_success()
        self.session.post(
            f"{BASE_URL}/api/inventory/inventory-logout",
            headers=headers,
            json={"session_id": session_id}
        )
        
        # Try to logout again
        response = self.session.post(
            f"{BASE_URL}/api/inventory/inventory-logout",
            headers=headers,
            json={"session_id": session_id}
        )
        
        assert response.status_code == 400, f"Expected 400 for already ended session, got {response.status_code}"
        print(f"✓ Double logout rejection working")
    
    # ============ ADMIN INVENTORY TEAM TESTS ============
    
    def test_admin_get_inventory_team(self):
        """Test admin getting inventory team performance data"""
        headers = self.get_auth_headers()
        
        # First create a session to have some data
        self.test_inventory_login_success()
        
        response = self.session.get(
            f"{BASE_URL}/api/inventory/admin/inventory-team",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get inventory team failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "date" in data
        assert "summary" in data
        assert "sessions" in data
        
        summary = data["summary"]
        assert "total_users_logged" in summary
        assert "total_sessions" in summary
        assert "active_sessions" in summary
        assert "total_properties_added" in summary
        assert "good_performers" in summary
        assert "needs_attention" in summary
        
        print(f"✓ Admin inventory team data retrieved: {summary['total_sessions']} sessions, {summary['active_sessions']} active")
    
    def test_admin_get_inventory_team_with_date(self):
        """Test admin getting inventory team data for specific date"""
        headers = self.get_auth_headers()
        
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = self.session.get(
            f"{BASE_URL}/api/inventory/admin/inventory-team?date={today}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get inventory team with date failed: {response.text}"
        data = response.json()
        assert data.get("date") == today
        print(f"✓ Admin inventory team data for {today} retrieved")
    
    def test_admin_get_inventory_user_detail(self):
        """Test admin getting detailed inventory user session info"""
        headers = self.get_auth_headers()
        
        # First create a session
        session_id = self.test_inventory_login_success()
        
        response = self.session.get(
            f"{BASE_URL}/api/inventory/admin/inventory-user-detail/{session_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get inventory user detail failed: {response.text}"
        data = response.json()
        
        assert "session_id" in data
        assert "inventory_user_name" in data
        assert "login_time" in data
        assert "selected_cities" in data
        assert "city_targets" in data
        
        print(f"✓ Admin inventory user detail retrieved: {data['inventory_user_name']}")
    
    # ============ ADMIN UPDATE INVENTORY KEY TEST ============
    
    def test_admin_update_inventory_key(self):
        """Test admin updating inventory access key"""
        headers = self.get_auth_headers()
        
        # Update to a new key
        new_key = "test_key_2024"
        response = self.session.post(
            f"{BASE_URL}/api/inventory/admin/update-inventory-key?new_key={new_key}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Update inventory key failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Inventory key updated successfully")
        
        # Verify new key works
        verify_response = self.session.post(
            f"{BASE_URL}/api/inventory/verify-key",
            headers=headers,
            json={"access_type": "inventory", "key": new_key}
        )
        assert verify_response.status_code == 200, "New key verification failed"
        print(f"✓ New inventory key verified")
        
        # Restore original key
        restore_response = self.session.post(
            f"{BASE_URL}/api/inventory/admin/update-inventory-key?new_key={INVENTORY_ACCESS_KEY}",
            headers=headers
        )
        assert restore_response.status_code == 200, "Key restoration failed"
        print(f"✓ Original inventory key restored")
    
    def test_admin_update_inventory_key_too_short(self):
        """Test admin updating inventory key with too short key"""
        headers = self.get_auth_headers()
        
        response = self.session.post(
            f"{BASE_URL}/api/inventory/admin/update-inventory-key?new_key=abc",
            headers=headers
        )
        
        assert response.status_code == 400, f"Expected 400 for short key, got {response.status_code}"
        print(f"✓ Short key rejection working")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
