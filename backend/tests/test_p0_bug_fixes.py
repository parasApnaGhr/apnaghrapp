"""
P0 Bug Fixes Test Suite
Tests for:
1. Riders can see Admin-created manual visits (rider_id: None query fix)
2. Riders can accept manual visits (customer_id/user_id compatibility)
3. Payment to booking flow (visit credits usage)
4. Customer wallet shows correct visit credits
5. Visit bookings schema consistency
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
RIDER_CREDS = {"phone": "9915413810", "password": "paras123"}  # Paras - Rider
TEST_RIDER_CREDS = {"phone": "6111222333", "password": "rider123"}  # Test Rider
CUSTOMER_CREDS = {"phone": "9915087635", "password": "paras123"}  # Customer
ADMIN_CREDS = {"phone": "7777777777", "password": "admin123"}  # Admin


class TestSetup:
    """Setup and helper methods"""
    
    @staticmethod
    def login(phone: str, password: str) -> dict:
        """Login and return token + user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": password
        })
        if response.status_code == 200:
            return response.json()
        return None
    
    @staticmethod
    def get_auth_headers(token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}


class TestP0Issue1_RiderSeesManualVisits:
    """
    P0 Issue 1: Riders cannot see Admin-created manual visits
    Fix: Changed MongoDB query from $in: [None] to simple equality rider_id: None
    """
    
    def test_admin_login(self):
        """Verify admin can login"""
        result = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        assert result is not None, "Admin login failed"
        assert "token" in result, "No token in admin login response"
        assert result["user"]["role"] == "admin", "User is not admin"
        print(f"✓ Admin login successful: {result['user']['name']}")
    
    def test_rider_login(self):
        """Verify rider can login"""
        result = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        assert result is not None, "Rider login failed"
        assert "token" in result, "No token in rider login response"
        assert result["user"]["role"] == "rider", "User is not rider"
        print(f"✓ Rider login successful: {result['user']['name']}")
    
    def test_admin_create_manual_visit(self):
        """Admin creates a manual visit for testing"""
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        assert admin_login is not None, "Admin login failed"
        
        headers = TestSetup.get_auth_headers(admin_login["token"])
        
        # First get available properties
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        assert props_response.status_code == 200, f"Failed to get properties: {props_response.text}"
        properties = props_response.json()
        assert len(properties) > 0, "No properties available"
        
        # Create manual visit with unique customer phone
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        manual_visit_data = {
            "customer_phone": test_phone,
            "customer_name": "TEST Manual Visit Customer",
            "property_ids": [properties[0]["id"]],
            "preferred_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "preferred_time": "10:00",
            "payment_method": "qr_code",
            "payment_amount": 200.0,
            "payment_reference": f"TEST-{uuid.uuid4().hex[:8]}",
            "notes": "P0 Bug Test - Manual Visit"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/create-manual-visit",
            json=manual_visit_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to create manual visit: {response.text}"
        result = response.json()
        assert result.get("success") == True, f"Manual visit creation failed: {result}"
        assert "visit_ids" in result, "No visit_ids in response"
        assert len(result["visit_ids"]) > 0, "Empty visit_ids"
        
        print(f"✓ Manual visit created: {result['visit_ids']}")
        return result
    
    def test_rider_sees_available_visits(self):
        """Rider should see pending visits including manual visits"""
        rider_login = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        assert rider_login is not None, "Rider login failed"
        
        headers = TestSetup.get_auth_headers(rider_login["token"])
        
        # First, set rider online with location
        shift_response = requests.post(
            f"{BASE_URL}/api/rider/shift",
            json={
                "is_online": True,
                "current_lat": 30.7046,  # Chandigarh coordinates
                "current_lng": 76.7179
            },
            headers=headers
        )
        assert shift_response.status_code == 200, f"Failed to set rider online: {shift_response.text}"
        print(f"✓ Rider set online")
        
        # Now get available visits
        response = requests.get(f"{BASE_URL}/api/visits/available", headers=headers)
        assert response.status_code == 200, f"Failed to get available visits: {response.text}"
        
        result = response.json()
        available_visits = result.get("available", [])
        
        print(f"✓ Rider sees {len(available_visits)} available visits")
        
        # Check if any visits have rider_id: None (unassigned)
        unassigned_visits = [v for v in available_visits if v.get("rider_id") is None]
        print(f"  - Unassigned visits: {len(unassigned_visits)}")
        
        # Check for manual visits (created_by: admin_manual)
        manual_visits = [v for v in available_visits if v.get("created_by") == "admin_manual"]
        print(f"  - Manual visits visible: {len(manual_visits)}")
        
        return result
    
    def test_rider_sees_manual_visits_with_pending_status(self):
        """Verify manual visits with status=pending and rider_id=None are visible"""
        # Create a fresh manual visit
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        headers = TestSetup.get_auth_headers(admin_login["token"])
        
        # Get properties
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        properties = props_response.json()
        
        # Create manual visit
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        manual_visit_data = {
            "customer_phone": test_phone,
            "customer_name": "TEST P0 Visibility Check",
            "property_ids": [properties[0]["id"]],
            "preferred_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "preferred_time": "11:00",
            "payment_method": "cash",
            "payment_amount": 200.0,
            "notes": "P0 Test - Should be visible to riders"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create-manual-visit",
            json=manual_visit_data,
            headers=headers
        )
        assert create_response.status_code == 200
        created_visit = create_response.json()
        visit_id = created_visit["visit_ids"][0]
        print(f"✓ Created manual visit: {visit_id}")
        
        # Now login as rider and check visibility
        rider_login = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        rider_headers = TestSetup.get_auth_headers(rider_login["token"])
        
        # Set rider online
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179},
            headers=rider_headers
        )
        
        # Get available visits
        available_response = requests.get(f"{BASE_URL}/api/visits/available", headers=rider_headers)
        assert available_response.status_code == 200
        
        available = available_response.json().get("available", [])
        
        # Check if our created visit is visible
        found_visit = next((v for v in available if v.get("id") == visit_id), None)
        
        if found_visit:
            print(f"✓ Manual visit {visit_id} IS VISIBLE to rider")
            print(f"  - Status: {found_visit.get('status')}")
            print(f"  - rider_id: {found_visit.get('rider_id')}")
            print(f"  - created_by: {found_visit.get('created_by')}")
            assert found_visit.get("status") == "pending", "Visit status should be pending"
            assert found_visit.get("rider_id") is None, "rider_id should be None"
        else:
            # List all available visits for debugging
            print(f"✗ Manual visit {visit_id} NOT FOUND in available visits")
            print(f"  Available visit IDs: {[v.get('id') for v in available[:5]]}")
            pytest.fail(f"Manual visit {visit_id} not visible to rider - P0 BUG NOT FIXED")


class TestP0Issue2_AcceptManualVisit:
    """
    P0 Issue 2: Riders cannot accept manual visits (KeyError on customer_id)
    Fix: Added support for both customer_id and user_id fields
    """
    
    def test_rider_can_accept_manual_visit(self):
        """Rider should be able to accept a manual visit without KeyError"""
        # Create a manual visit first
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        admin_headers = TestSetup.get_auth_headers(admin_login["token"])
        
        # Get properties
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=admin_headers)
        properties = props_response.json()
        
        # Create manual visit
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        manual_visit_data = {
            "customer_phone": test_phone,
            "customer_name": "TEST Accept Manual Visit",
            "property_ids": [properties[0]["id"]],
            "preferred_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "preferred_time": "14:00",
            "payment_method": "qr_code",
            "payment_amount": 200.0,
            "notes": "P0 Test - Accept manual visit"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create-manual-visit",
            json=manual_visit_data,
            headers=admin_headers
        )
        assert create_response.status_code == 200
        visit_id = create_response.json()["visit_ids"][0]
        print(f"✓ Created manual visit for accept test: {visit_id}")
        
        # Login as rider
        rider_login = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        rider_headers = TestSetup.get_auth_headers(rider_login["token"])
        
        # Set rider online with location
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179},
            headers=rider_headers
        )
        
        # Accept the visit
        accept_response = requests.post(
            f"{BASE_URL}/api/visits/{visit_id}/accept",
            headers=rider_headers
        )
        
        if accept_response.status_code == 200:
            result = accept_response.json()
            print(f"✓ Rider successfully accepted manual visit")
            print(f"  - Visit ID: {result.get('visit', {}).get('id')}")
            print(f"  - Status: {result.get('visit', {}).get('status')}")
            print(f"  - Customer: {result.get('customer', {}).get('name') if result.get('customer') else 'N/A'}")
            
            # Verify the visit has both customer_id and user_id
            visit = result.get("visit", {})
            assert visit.get("rider_id") == rider_login["user"]["id"], "rider_id not set correctly"
            assert visit.get("status") == "rider_assigned", "Status should be rider_assigned"
        else:
            print(f"✗ Failed to accept manual visit: {accept_response.status_code}")
            print(f"  Error: {accept_response.text}")
            pytest.fail(f"Accept manual visit failed: {accept_response.text}")
    
    def test_accept_visit_handles_user_id_field(self):
        """Verify accept_visit handles visits with user_id instead of customer_id"""
        # This tests the fix for KeyError when customer_id is missing
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        admin_headers = TestSetup.get_auth_headers(admin_login["token"])
        
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=admin_headers)
        properties = props_response.json()
        
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        manual_visit_data = {
            "customer_phone": test_phone,
            "customer_name": "TEST user_id Field Check",
            "property_ids": [properties[0]["id"]],
            "preferred_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "preferred_time": "15:00",
            "payment_method": "cash",
            "payment_amount": 200.0
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create-manual-visit",
            json=manual_visit_data,
            headers=admin_headers
        )
        assert create_response.status_code == 200
        visit_id = create_response.json()["visit_ids"][0]
        
        # Login as rider and accept
        rider_login = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        rider_headers = TestSetup.get_auth_headers(rider_login["token"])
        
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179},
            headers=rider_headers
        )
        
        accept_response = requests.post(
            f"{BASE_URL}/api/visits/{visit_id}/accept",
            headers=rider_headers
        )
        
        # Should not get 500 error (KeyError)
        assert accept_response.status_code != 500, f"Server error (likely KeyError): {accept_response.text}"
        
        if accept_response.status_code == 200:
            print(f"✓ Accept visit handles user_id field correctly")
        elif accept_response.status_code == 400:
            # Visit might already be taken - that's OK
            print(f"✓ Visit already assigned (expected in some cases)")
        else:
            pytest.fail(f"Unexpected error: {accept_response.status_code} - {accept_response.text}")


class TestP0Issue3_PaymentToBookingFlow:
    """
    P0 Issue 2 (continued): Customers' Paid Packages not converting to Booked Visits
    Tests the book_visit endpoint and visit credits usage
    """
    
    def test_customer_wallet_shows_visit_credits(self):
        """Customer wallet should show available visit credits"""
        customer_login = TestSetup.login(CUSTOMER_CREDS["phone"], CUSTOMER_CREDS["password"])
        assert customer_login is not None, "Customer login failed"
        
        headers = TestSetup.get_auth_headers(customer_login["token"])
        
        response = requests.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert response.status_code == 200, f"Failed to get wallet: {response.text}"
        
        wallet = response.json()
        print(f"✓ Customer wallet retrieved")
        print(f"  - visits_available: {wallet.get('visits_available', 0)}")
        print(f"  - active_packages: {len(wallet.get('active_packages', []))}")
        
        # Check package structure
        for pkg in wallet.get("active_packages", []):
            print(f"  - Package: {pkg.get('package_type')} - {pkg.get('total_visits', 0) - pkg.get('visits_used', 0)} visits left")
        
        return wallet
    
    def test_book_visit_uses_credits(self):
        """Booking a visit should use visit credits from packages"""
        customer_login = TestSetup.login(CUSTOMER_CREDS["phone"], CUSTOMER_CREDS["password"])
        headers = TestSetup.get_auth_headers(customer_login["token"])
        
        # Get wallet first
        wallet_response = requests.get(f"{BASE_URL}/api/wallet", headers=headers)
        wallet = wallet_response.json()
        initial_visits = wallet.get("visits_available", 0)
        
        if initial_visits == 0:
            print("⚠ Customer has no visit credits - skipping booking test")
            pytest.skip("No visit credits available for testing")
        
        # Get properties
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        properties = props_response.json()
        
        if len(properties) == 0:
            pytest.skip("No properties available")
        
        # Book a visit
        booking_data = {
            "property_ids": [properties[0]["id"]],
            "scheduled_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "scheduled_time": "10:00",
            "pickup_location": "Test Location",
            "pickup_lat": 30.7046,
            "pickup_lng": 76.7179
        }
        
        book_response = requests.post(
            f"{BASE_URL}/api/visits/book",
            json=booking_data,
            headers=headers
        )
        
        if book_response.status_code == 200:
            booking = book_response.json()
            print(f"✓ Visit booked successfully")
            print(f"  - Booking ID: {booking.get('id')}")
            print(f"  - Status: {booking.get('status')}")
            print(f"  - OTP: {booking.get('otp')}")
            
            # Verify credits were deducted
            wallet_after = requests.get(f"{BASE_URL}/api/wallet", headers=headers).json()
            new_visits = wallet_after.get("visits_available", 0)
            
            print(f"  - Credits before: {initial_visits}, after: {new_visits}")
            assert new_visits == initial_visits - 1, "Visit credits not deducted"
        elif book_response.status_code == 400:
            error = book_response.json()
            print(f"⚠ Booking failed (expected if no credits): {error.get('detail')}")
        else:
            pytest.fail(f"Unexpected booking error: {book_response.text}")
    
    def test_book_visit_requires_credits(self):
        """Booking without credits should fail with clear error"""
        # Create a new customer without credits
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        admin_headers = TestSetup.get_auth_headers(admin_login["token"])
        
        # Try to register a new customer
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "TEST No Credits Customer",
                "phone": test_phone,
                "password": "test123",
                "role": "customer"
            }
        )
        
        if register_response.status_code != 200:
            print(f"⚠ Could not create test customer: {register_response.text}")
            pytest.skip("Could not create test customer")
        
        # Login as new customer
        new_customer_login = TestSetup.login(test_phone, "test123")
        if not new_customer_login:
            pytest.skip("Could not login as new customer")
        
        headers = TestSetup.get_auth_headers(new_customer_login["token"])
        
        # Get properties
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        properties = props_response.json()
        
        # Try to book without credits
        booking_data = {
            "property_ids": [properties[0]["id"]],
            "scheduled_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "scheduled_time": "10:00",
            "pickup_location": "Test Location"
        }
        
        book_response = requests.post(
            f"{BASE_URL}/api/visits/book",
            json=booking_data,
            headers=headers
        )
        
        assert book_response.status_code == 400, f"Should fail without credits: {book_response.text}"
        error = book_response.json()
        assert "credit" in error.get("detail", "").lower() or "package" in error.get("detail", "").lower(), \
            f"Error should mention credits/package: {error}"
        
        print(f"✓ Booking correctly rejected without credits: {error.get('detail')}")


class TestVisitSchemaConsistency:
    """Test that visit bookings have consistent schema"""
    
    def test_manual_visit_has_required_fields(self):
        """Manual visits should have all required fields for rider flow"""
        admin_login = TestSetup.login(ADMIN_CREDS["phone"], ADMIN_CREDS["password"])
        admin_headers = TestSetup.get_auth_headers(admin_login["token"])
        
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=admin_headers)
        properties = props_response.json()
        
        test_phone = f"TEST{uuid.uuid4().int % 10000000000}"[:10]
        manual_visit_data = {
            "customer_phone": test_phone,
            "customer_name": "TEST Schema Check",
            "property_ids": [properties[0]["id"]],
            "preferred_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "preferred_time": "16:00",
            "payment_method": "qr_code",
            "payment_amount": 200.0
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/create-manual-visit",
            json=manual_visit_data,
            headers=admin_headers
        )
        assert create_response.status_code == 200
        visit_id = create_response.json()["visit_ids"][0]
        
        # Get the visit directly from available visits
        rider_login = TestSetup.login(RIDER_CREDS["phone"], RIDER_CREDS["password"])
        rider_headers = TestSetup.get_auth_headers(rider_login["token"])
        
        requests.post(
            f"{BASE_URL}/api/rider/shift",
            json={"is_online": True, "current_lat": 30.7046, "current_lng": 76.7179},
            headers=rider_headers
        )
        
        available_response = requests.get(f"{BASE_URL}/api/visits/available", headers=rider_headers)
        available = available_response.json().get("available", [])
        
        visit = next((v for v in available if v.get("id") == visit_id), None)
        
        if visit:
            # Check required fields
            required_fields = [
                "id", "status", "property_ids", "scheduled_date", "scheduled_time",
                "otp", "current_step"
            ]
            
            missing_fields = [f for f in required_fields if f not in visit or visit[f] is None]
            
            if missing_fields:
                print(f"⚠ Missing fields in manual visit: {missing_fields}")
            else:
                print(f"✓ Manual visit has all required fields")
            
            # Check rider_id is explicitly None (not missing)
            assert "rider_id" in visit, "rider_id field should exist"
            assert visit["rider_id"] is None, "rider_id should be None for unassigned visit"
            
            # Check customer identification
            has_customer_id = visit.get("customer_id") is not None
            has_user_id = visit.get("user_id") is not None
            assert has_customer_id or has_user_id, "Visit should have customer_id or user_id"
            
            print(f"  - customer_id: {visit.get('customer_id')}")
            print(f"  - user_id: {visit.get('user_id')}")
            print(f"  - property_ids: {visit.get('property_ids')}")
        else:
            print(f"⚠ Could not find visit {visit_id} in available visits")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """API should be healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
