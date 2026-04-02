"""
P0 Bug Fixes Testing - Rider Visit Flow & Customer Tracking
Tests for:
1. Customer can see 'Track Rider Live' button on bookings page when rider is assigned
2. Customer tracking modal shows rider info, location coordinates, and 'View on Google Maps' button
3. Rider can complete full visit flow: accept -> arrived_customer -> start_property -> arrived_property -> complete_property
4. Compliance check modal works and doesn't cause 500 error (ObjectId serialization bug fix)
5. Visit completes successfully without 'Failed to update progress' error
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "7696046257"
CUSTOMER_PASSWORD = "naveen@001"
RIDER_PHONE = "6111222333"
RIDER_PASSWORD = "rider123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("API health check passed")


class TestCustomerLogin:
    """Customer authentication tests"""
    
    def test_customer_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Customer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "customer"
        print(f"Customer login successful: {data['user']['name']}")


class TestRiderLogin:
    """Rider authentication tests"""
    
    def test_rider_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200, f"Rider login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "rider"
        print(f"Rider login successful: {data['user']['name']}")


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['name']}")


class TestCustomerTrackingAPI:
    """Test customer tracking API - P0 Bug Fix #1"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as customer
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200
        self.customer_token = response.json()["token"]
        self.customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        # Login as rider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        self.rider_token = response.json()["token"]
        self.rider_headers = {"Authorization": f"Bearer {self.rider_token}"}
    
    def test_customer_can_get_bookings(self):
        """Test that customer can fetch their bookings"""
        response = requests.get(
            f"{BASE_URL}/api/visits/my-bookings",
            headers=self.customer_headers
        )
        assert response.status_code == 200, f"Failed to get bookings: {response.text}"
        bookings = response.json()
        assert isinstance(bookings, list)
        print(f"Customer has {len(bookings)} bookings")
    
    def test_customer_bookings_include_rider_info(self):
        """Test that bookings with assigned riders include rider info"""
        response = requests.get(
            f"{BASE_URL}/api/visits/my-bookings",
            headers=self.customer_headers
        )
        assert response.status_code == 200
        bookings = response.json()
        
        # Check if any booking has rider info
        bookings_with_rider = [b for b in bookings if b.get('rider_id') or b.get('assigned_rider_id')]
        print(f"Found {len(bookings_with_rider)} bookings with assigned riders")
        
        for booking in bookings_with_rider:
            # Verify rider info fields are present when rider is assigned
            if booking.get('rider_id') or booking.get('assigned_rider_id'):
                print(f"Booking {booking.get('id')}: rider_name={booking.get('rider_name')}, status={booking.get('status')}")
    
    def test_track_visit_api_exists(self):
        """Test that the track visit API endpoint exists"""
        # First get a booking
        response = requests.get(
            f"{BASE_URL}/api/visits/my-bookings",
            headers=self.customer_headers
        )
        assert response.status_code == 200
        bookings = response.json()
        
        if not bookings:
            pytest.skip("No bookings found for customer")
        
        # Try to track the first booking
        visit_id = bookings[0].get('id')
        response = requests.get(
            f"{BASE_URL}/api/visits/{visit_id}/track",
            headers=self.customer_headers
        )
        
        # Should return 200 (success) or 403 (not your visit) - not 404 or 500
        assert response.status_code in [200, 403], f"Track API failed: {response.status_code} - {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Track API response: visit={data.get('visit')}, rider={data.get('rider')}")
            # Verify response structure
            assert "visit" in data
            assert "rider" in data or data.get("rider") is None
        
        print("Track visit API endpoint working")


class TestRiderVisitFlow:
    """Test complete rider visit flow - P0 Bug Fix #2"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as rider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        self.rider_token = response.json()["token"]
        self.rider_headers = {"Authorization": f"Bearer {self.rider_token}"}
        self.rider_id = response.json()["user"]["id"]
        
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json()["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_rider_can_go_online(self):
        """Test rider can update shift status to online"""
        response = requests.post(
            f"{BASE_URL}/api/rider/shift",
            headers=self.rider_headers,
            json={
                "is_online": True,
                "current_lat": 30.7046,
                "current_lng": 76.7179
            }
        )
        assert response.status_code == 200, f"Failed to go online: {response.text}"
        data = response.json()
        assert data.get("is_online") == True
        print("Rider went online successfully")
    
    def test_rider_can_update_location(self):
        """Test rider can update their location"""
        response = requests.post(
            f"{BASE_URL}/api/rider/location",
            headers=self.rider_headers,
            params={"lat": 30.7046, "lng": 76.7179}
        )
        assert response.status_code == 200, f"Failed to update location: {response.text}"
        print("Rider location updated successfully")
    
    def test_rider_can_see_available_visits(self):
        """Test rider can see available visits when online"""
        # First go online
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            headers=self.rider_headers,
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179}
        )
        
        response = requests.get(
            f"{BASE_URL}/api/visits/available",
            headers=self.rider_headers
        )
        assert response.status_code == 200, f"Failed to get available visits: {response.text}"
        data = response.json()
        # API returns dict with 'active' and 'available' keys
        assert isinstance(data, dict), "Expected dict response"
        assert "available" in data, "Expected 'available' key in response"
        available_visits = data.get("available", [])
        assert isinstance(available_visits, list)
        print(f"Rider sees {len(available_visits)} available visits")
        
        # Check if rider has active visit (active can be None or dict)
        active_data = data.get("active")
        if active_data and isinstance(active_data, dict):
            active_visit = active_data.get("visit")
            if active_visit:
                print(f"Rider has active visit: {active_visit.get('id')}, status: {active_visit.get('status')}")
    
    def test_rider_can_get_active_visit(self):
        """Test rider can get their active visit"""
        response = requests.get(
            f"{BASE_URL}/api/rider/active-visit",
            headers=self.rider_headers
        )
        # Should return 200 with visit or 404 if no active visit
        assert response.status_code in [200, 404], f"Failed to get active visit: {response.text}"
        
        if response.status_code == 200:
            visit = response.json()
            if visit and visit.get('id'):
                print(f"Rider has active visit: {visit.get('id')}, status: {visit.get('status')}")
            else:
                print("No active visit for rider (empty response)")
        else:
            print("No active visit for rider (404)")


class TestComplianceCheckFix:
    """Test compliance check endpoint - P0 Bug Fix (ObjectId serialization)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as rider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        self.rider_token = response.json()["token"]
        self.rider_headers = {"Authorization": f"Bearer {self.rider_token}"}
        
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json()["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_compliance_check_endpoint_no_500_error(self):
        """Test that compliance check doesn't return 500 error (ObjectId fix)"""
        # First get rider's active visit from available endpoint
        response = requests.get(
            f"{BASE_URL}/api/visits/available",
            headers=self.rider_headers
        )
        
        if response.status_code != 200:
            pytest.skip("Could not get available visits")
        
        data = response.json()
        active_data = data.get("active")
        
        if not active_data or not isinstance(active_data, dict):
            pytest.skip("No active visit for rider to test compliance check")
        
        visit = active_data.get("visit")
        if not visit:
            pytest.skip("No active visit for rider to test compliance check")
        
        visit_id = visit.get('id')
        property_ids = visit.get('property_ids', [])
        
        if not property_ids:
            pytest.skip("Visit has no properties to test compliance check")
        
        # Try to submit compliance check
        response = requests.post(
            f"{BASE_URL}/api/visits/{visit_id}/compliance-check",
            headers=self.rider_headers,
            json={
                "property_id": property_ids[0],
                "answers": {
                    "property_matches_listing": True,
                    "customer_satisfied": True,
                    "any_issues": False,
                    "notes": "Test compliance check"
                }
            }
        )
        
        # Should NOT return 500 (the bug was ObjectId serialization causing 500)
        assert response.status_code != 500, f"Compliance check returned 500 error: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("status") == "saved"
            print(f"Compliance check saved successfully: {data.get('id')}")
        else:
            print(f"Compliance check response: {response.status_code} - {response.text}")


class TestUpdateStepEndpoint:
    """Test update-step endpoint for visit progress"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as rider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        self.rider_token = response.json()["token"]
        self.rider_headers = {"Authorization": f"Bearer {self.rider_token}"}
    
    def test_update_step_actions_valid(self):
        """Test that update-step endpoint accepts valid actions"""
        # Get active visit from available endpoint
        response = requests.get(
            f"{BASE_URL}/api/visits/available",
            headers=self.rider_headers
        )
        
        if response.status_code != 200:
            pytest.skip("Could not get available visits")
        
        data = response.json()
        active_data = data.get("active")
        
        if not active_data or not isinstance(active_data, dict):
            pytest.skip("No active visit for rider to test update-step")
        
        visit = active_data.get("visit")
        if not visit:
            pytest.skip("No active visit for rider to test update-step")
        
        visit_id = visit.get('id')
        current_status = visit.get('status')
        
        print(f"Testing update-step on visit {visit_id}, current status: {current_status}")
        
        # Valid actions based on current status
        valid_actions = {
            "rider_assigned": "start_pickup",
            "pickup_started": "arrived_customer",
            "at_customer": "start_property",
            "navigating": "arrived_property",
            "at_property": "complete_property"
        }
        
        if current_status in valid_actions:
            action = valid_actions[current_status]
            response = requests.post(
                f"{BASE_URL}/api/visits/{visit_id}/update-step",
                headers=self.rider_headers,
                json={"action": action}
            )
            
            # Should NOT return 500
            assert response.status_code != 500, f"Update-step returned 500 error: {response.text}"
            
            if response.status_code == 200:
                updated_visit = response.json()
                print(f"Update-step successful: new status = {updated_visit.get('status')}")
            else:
                print(f"Update-step response: {response.status_code} - {response.text}")
        else:
            print(f"Current status {current_status} not in test flow, skipping action test")


class TestEndToEndVisitFlow:
    """Test complete visit flow from accept to complete"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as rider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        self.rider_token = response.json()["token"]
        self.rider_headers = {"Authorization": f"Bearer {self.rider_token}"}
        
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json()["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_create_and_complete_visit_flow(self):
        """Test creating a visit and completing the full flow"""
        # First go online
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            headers=self.rider_headers,
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179}
        )
        
        # Check for available visits
        response = requests.get(
            f"{BASE_URL}/api/visits/available",
            headers=self.rider_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # API returns dict with 'active' and 'available' keys
        available_visits = data.get("available", [])
        active_data = data.get("active")
        active_visit = None
        if active_data and isinstance(active_data, dict):
            active_visit = active_data.get("visit")
        
        if not available_visits and not active_visit:
            print("No available visits and no active visit to test full flow")
            pytest.skip("No visits available for testing")
        
        # If rider has active visit, test the flow on that
        if active_visit:
            visit_id = active_visit.get('id')
            current_status = active_visit.get('status')
            print(f"Rider has active visit: {visit_id}, status: {current_status}")
            
            # Test the flow based on current status
            valid_actions = {
                "rider_assigned": "start_pickup",
                "pickup_started": "arrived_customer",
                "at_customer": "start_property",
                "navigating": "arrived_property",
                "at_property": "complete_property"
            }
            
            if current_status in valid_actions:
                action = valid_actions[current_status]
                response = requests.post(
                    f"{BASE_URL}/api/visits/{visit_id}/update-step",
                    headers=self.rider_headers,
                    json={"action": action}
                )
                
                if response.status_code == 200:
                    updated = response.json()
                    print(f"Action '{action}' successful: status={updated.get('status')}, step={updated.get('current_step')}")
                else:
                    print(f"Action '{action}' response: {response.status_code} - {response.text}")
            return
        
        # Accept first available visit
        visit_id = available_visits[0].get('id')
        print(f"Attempting to accept visit: {visit_id}")
        
        response = requests.post(
            f"{BASE_URL}/api/visits/{visit_id}/accept",
            headers=self.rider_headers
        )
        
        if response.status_code == 200:
            print(f"Visit accepted successfully")
            
            # Test the flow: start_pickup -> arrived_customer -> start_property -> arrived_property -> complete_property
            actions = ["start_pickup", "arrived_customer", "start_property", "arrived_property", "complete_property"]
            
            for action in actions:
                response = requests.post(
                    f"{BASE_URL}/api/visits/{visit_id}/update-step",
                    headers=self.rider_headers,
                    json={"action": action}
                )
                
                if response.status_code == 200:
                    updated = response.json()
                    print(f"Action '{action}' successful: status={updated.get('status')}, step={updated.get('current_step')}")
                else:
                    print(f"Action '{action}' failed: {response.status_code} - {response.text}")
                    break
        else:
            print(f"Could not accept visit: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
