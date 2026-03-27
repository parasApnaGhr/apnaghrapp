"""
ApnaGhr Visit Platform API Tests
Tests for:
- Auth endpoints (login)
- Rider shift system (toggle online/offline)
- Multi-property visit booking and navigation
- Visit step updates (Uber Eats style navigation)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from agent context
CUSTOMER_PHONE = "9999999999"
CUSTOMER_PASSWORD = "test123"
RIDER_PHONE = "8888888888"
RIDER_PASSWORD = "test123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_customer_login_success(self):
        """Test customer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["phone"] == CUSTOMER_PHONE
        assert data["user"]["role"] == "customer"
    
    def test_rider_login_success(self):
        """Test rider login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["phone"] == RIDER_PHONE
        assert data["user"]["role"] == "rider"
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0000000000",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture
def customer_token():
    """Get customer auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": CUSTOMER_PHONE,
        "password": CUSTOMER_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Customer authentication failed")


@pytest.fixture
def rider_token():
    """Get rider auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": RIDER_PHONE,
        "password": RIDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Rider authentication failed")


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin authentication failed")


class TestRiderShiftSystem:
    """Rider shift toggle online/offline tests"""
    
    def test_get_rider_shift_status(self, rider_token):
        """Test getting rider's current shift status"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/shift", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "is_online" in data
        assert isinstance(data["is_online"], bool)
    
    def test_toggle_rider_online(self, rider_token):
        """Test toggling rider to online status"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.post(f"{BASE_URL}/api/rider/shift", headers=headers, json={
            "is_online": True,
            "current_lat": 28.6139,
            "current_lng": 77.2090
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["is_online"] == True
    
    def test_toggle_rider_offline(self, rider_token):
        """Test toggling rider to offline status"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.post(f"{BASE_URL}/api/rider/shift", headers=headers, json={
            "is_online": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["is_online"] == False
    
    def test_customer_cannot_access_rider_shift(self, customer_token):
        """Test that customer cannot access rider shift endpoint"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/shift", headers=headers)
        assert response.status_code == 403


class TestProperties:
    """Property listing tests"""
    
    def test_get_properties_list(self, customer_token):
        """Test getting list of available properties"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_single_property(self, customer_token):
        """Test getting a single property by ID"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        # First get list to find a property ID
        list_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        if list_response.status_code == 200 and len(list_response.json()) > 0:
            property_id = list_response.json()[0]["id"]
            response = requests.get(f"{BASE_URL}/api/properties/{property_id}", headers=headers)
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "rent" in data


class TestVisitBooking:
    """Multi-property visit booking tests"""
    
    def test_get_customer_bookings(self, customer_token):
        """Test getting customer's visit bookings"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/visits/my-bookings", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_available_visits_for_rider(self, rider_token):
        """Test getting available visits for rider (must be online)"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        # First ensure rider is online
        requests.post(f"{BASE_URL}/api/rider/shift", headers=headers, json={"is_online": True})
        
        response = requests.get(f"{BASE_URL}/api/visits/available", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_rider_active_visit(self, rider_token):
        """Test getting rider's currently active visit"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        response = requests.get(f"{BASE_URL}/api/rider/active-visit", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        # Response can be null if no active visit


class TestVisitStepNavigation:
    """Test Uber Eats style step-by-step navigation"""
    
    def test_visit_booking_has_multi_property_fields(self, customer_token):
        """Test that visit bookings have multi-property support fields"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/visits/my-bookings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            booking = data[0]
            # Check multi-property fields exist
            assert "property_ids" in booking, "Booking should have property_ids list"
            assert "current_step" in booking, "Booking should have current_step"
            assert "current_property_index" in booking, "Booking should have current_property_index"
            assert "properties_completed" in booking, "Booking should have properties_completed list"
            assert "total_properties" in booking, "Booking should have total_properties count"
    
    def test_visit_details_endpoint(self, customer_token):
        """Test getting full visit details"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        # Get bookings first
        bookings_response = requests.get(f"{BASE_URL}/api/visits/my-bookings", headers=headers)
        if bookings_response.status_code == 200 and len(bookings_response.json()) > 0:
            visit_id = bookings_response.json()[0]["id"]
            response = requests.get(f"{BASE_URL}/api/visits/{visit_id}/details", headers=headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert "visit" in data
            assert "properties" in data
            assert "customer" in data


class TestVisitStepUpdates:
    """Test visit step update flow (rider navigation)"""
    
    def test_update_step_requires_rider_role(self, customer_token):
        """Test that only riders can update visit steps"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.post(f"{BASE_URL}/api/visits/fake-visit-id/update-step", 
                                headers=headers, 
                                json={"action": "start_pickup"})
        assert response.status_code == 403
    
    def test_rider_can_update_assigned_visit_step(self, rider_token):
        """Test rider can update step on their assigned visit"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        # First ensure rider is online
        requests.post(f"{BASE_URL}/api/rider/shift", headers=headers, json={"is_online": True})
        
        # Get active visit
        active_response = requests.get(f"{BASE_URL}/api/rider/active-visit", headers=headers)
        if active_response.status_code == 200 and active_response.json():
            visit_data = active_response.json()
            visit_id = visit_data["visit"]["id"]
            current_step = visit_data["visit"]["current_step"]
            
            # Determine next action based on current step
            step_actions = {
                "go_to_customer": "arrived_customer",
                "at_customer": "start_property",
            }
            
            if current_step in step_actions:
                action = step_actions[current_step]
                response = requests.post(f"{BASE_URL}/api/visits/{visit_id}/update-step",
                                        headers=headers,
                                        json={"action": action})
                assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
                data = response.json()
                assert "current_step" in data


class TestAdminEndpoints:
    """Admin-specific endpoint tests"""
    
    def test_get_online_riders(self, admin_token):
        """Test admin can get list of online riders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/riders/online", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_customer_cannot_access_admin_endpoints(self, customer_token):
        """Test customer cannot access admin endpoints"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/riders/online", headers=headers)
        assert response.status_code == 403


class TestChatEndpoints:
    """Chat functionality tests"""
    
    def test_get_conversations(self, customer_token):
        """Test getting chat conversations"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/conversations", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
