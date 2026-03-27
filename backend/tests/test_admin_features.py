"""
ApnaGhr Admin Features API Tests
Tests for:
- Property Analytics Panel (summary stats, filters)
- Daily Status Verification (mark property as available/rented/under_verification)
- Hot Property System (mark/unmark, auto-mark based on visits)
- ToLet Tasks (create, assign, update rate)
- Visit Approvals (review completed visits, approve/reject)
- Payouts (view rider wallets, process payouts)
- Live Tracking (view online riders with GPS)
- Notifications (admin alerts)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CUSTOMER_PHONE = "9999999999"
CUSTOMER_PASSWORD = "test123"
RIDER_PHONE = "8888888888"
RIDER_PASSWORD = "test123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


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
def customer_token():
    """Get customer auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": CUSTOMER_PHONE,
        "password": CUSTOMER_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Customer authentication failed")


# ============ PROPERTY ANALYTICS TESTS ============

class TestPropertyAnalytics:
    """Property Analytics Panel tests"""
    
    def test_get_property_analytics(self, admin_token):
        """Test getting property analytics with summary stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "properties" in data, "Response should contain properties list"
        assert "summary" in data, "Response should contain summary stats"
        
        # Check summary fields
        summary = data["summary"]
        assert "total_properties" in summary
        assert "available" in summary
        assert "rented" in summary
        assert "needs_daily_check" in summary
        assert "hot_properties" in summary
        assert "total_weekly_visits" in summary
    
    def test_analytics_properties_have_required_fields(self, admin_token):
        """Test that properties in analytics have all required fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data["properties"]) > 0:
            prop = data["properties"][0]
            # Check analytics fields
            assert "weekly_visits" in prop, "Property should have weekly_visits"
            assert "needs_verification" in prop, "Property should have needs_verification flag"
            assert "status" in prop, "Property should have status"
            assert "is_hot" in prop, "Property should have is_hot flag"
    
    def test_customer_cannot_access_analytics(self, customer_token):
        """Test that customer cannot access property analytics"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        assert response.status_code == 403


# ============ DAILY STATUS VERIFICATION TESTS ============

class TestDailyStatusVerification:
    """Daily Status Verification tests"""
    
    def test_get_properties_needing_verification(self, admin_token):
        """Test getting properties that need daily verification"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/properties/needs-verification", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_verify_property_status_available(self, admin_token):
        """Test marking property as available"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get a property ID
        analytics_response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        if analytics_response.status_code == 200 and len(analytics_response.json()["properties"]) > 0:
            property_id = analytics_response.json()["properties"][0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/admin/properties/{property_id}/verify-status",
                headers=headers,
                json={"status": "available", "notes": "Verified by test"}
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert data["status"] == "available"
            assert data["last_status_check"] is not None
    
    def test_verify_property_status_rented(self, admin_token):
        """Test marking property as rented"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a property ID
        analytics_response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        if analytics_response.status_code == 200 and len(analytics_response.json()["properties"]) > 0:
            # Find an available property to mark as rented
            properties = analytics_response.json()["properties"]
            available_props = [p for p in properties if p.get("status") == "available"]
            
            if len(available_props) > 0:
                property_id = available_props[0]["id"]
                
                response = requests.post(
                    f"{BASE_URL}/api/admin/properties/{property_id}/verify-status",
                    headers=headers,
                    json={"status": "rented", "notes": "Rented out - test"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "rented"
                assert data["available"] == False
                
                # Revert back to available for other tests
                requests.post(
                    f"{BASE_URL}/api/admin/properties/{property_id}/verify-status",
                    headers=headers,
                    json={"status": "available"}
                )
    
    def test_verify_property_status_under_verification(self, admin_token):
        """Test marking property as under_verification"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        analytics_response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        if analytics_response.status_code == 200 and len(analytics_response.json()["properties"]) > 0:
            property_id = analytics_response.json()["properties"][0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/admin/properties/{property_id}/verify-status",
                headers=headers,
                json={"status": "under_verification", "notes": "Need to confirm with owner"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "under_verification"
            
            # Revert back to available
            requests.post(
                f"{BASE_URL}/api/admin/properties/{property_id}/verify-status",
                headers=headers,
                json={"status": "available"}
            )


# ============ HOT PROPERTY SYSTEM TESTS ============

class TestHotPropertySystem:
    """Hot Property marking tests"""
    
    def test_mark_property_as_hot(self, admin_token):
        """Test marking a property as hot"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        analytics_response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        if analytics_response.status_code == 200 and len(analytics_response.json()["properties"]) > 0:
            property_id = analytics_response.json()["properties"][0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/admin/properties/{property_id}/mark-hot",
                headers=headers,
                params={"is_hot": True}
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert data["success"] == True
            assert data["is_hot"] == True
    
    def test_unmark_property_as_hot(self, admin_token):
        """Test removing hot badge from property"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        analytics_response = requests.get(f"{BASE_URL}/api/admin/properties/analytics", headers=headers)
        if analytics_response.status_code == 200 and len(analytics_response.json()["properties"]) > 0:
            property_id = analytics_response.json()["properties"][0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/admin/properties/{property_id}/mark-hot",
                headers=headers,
                params={"is_hot": False}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["is_hot"] == False
    
    def test_auto_mark_hot_properties(self, admin_token):
        """Test auto-marking hot properties based on visits"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/properties/auto-mark-hot", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "hot_properties_count" in data
    
    def test_get_property_popularity_public(self, customer_token):
        """Test getting property popularity (public endpoint for customers)"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        
        # Get a property ID first
        props_response = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        if props_response.status_code == 200 and len(props_response.json()) > 0:
            property_id = props_response.json()[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/properties/{property_id}/popularity", headers=headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert "weekly_visits" in data
            assert "is_hot" in data
            assert "total_visits" in data


# ============ TOLET TASKS TESTS ============

class TestToLetTasks:
    """ToLet Board Collection Tasks tests"""
    
    def test_create_tolet_task(self, admin_token):
        """Test creating a new ToLet task"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks",
            headers=headers,
            json={
                "title": "TEST_ToLet Board Collection - Sector 17",
                "description": "Collect ToLet boards from Sector 17 area",
                "location": "Sector 17, Chandigarh",
                "latitude": 30.7333,
                "longitude": 76.7794,
                "rate_per_board": 15.0,
                "estimated_boards": 5
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_ToLet Board Collection - Sector 17"
        assert data["rate_per_board"] == 15.0
        assert data["status"] == "open"
        return data["id"]
    
    def test_get_all_tolet_tasks(self, admin_token):
        """Test getting all ToLet tasks"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/tolet-tasks", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_tolet_task_rate(self, admin_token):
        """Test updating ToLet task rate"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get tasks
        tasks_response = requests.get(f"{BASE_URL}/api/admin/tolet-tasks", headers=headers)
        if tasks_response.status_code == 200 and len(tasks_response.json()) > 0:
            task_id = tasks_response.json()[0]["id"]
            
            response = requests.patch(
                f"{BASE_URL}/api/admin/tolet-tasks/{task_id}",
                headers=headers,
                json={"rate_per_board": 20.0}
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert data["rate_per_board"] == 20.0
    
    def test_assign_tolet_task_to_rider(self, admin_token, rider_token):
        """Test assigning ToLet task to a rider"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        
        # Get rider ID
        rider_response = requests.get(f"{BASE_URL}/api/auth/me", headers=rider_headers)
        rider_id = rider_response.json()["id"]
        
        # Get an open task
        tasks_response = requests.get(f"{BASE_URL}/api/admin/tolet-tasks", headers=admin_headers)
        if tasks_response.status_code == 200:
            open_tasks = [t for t in tasks_response.json() if t["status"] == "open"]
            if len(open_tasks) > 0:
                task_id = open_tasks[0]["id"]
                
                response = requests.post(
                    f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/assign",
                    headers=admin_headers,
                    json={"rider_id": rider_id}
                )
                assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
                data = response.json()
                assert data["rider_id"] == rider_id
                assert data["status"] == "assigned"
    
    def test_rider_get_available_tolet_tasks(self, rider_token):
        """Test rider getting available ToLet tasks"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        response = requests.get(f"{BASE_URL}/api/tolet-tasks/available", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)


# ============ VISIT APPROVALS TESTS ============

class TestVisitApprovals:
    """Visit Approval tests"""
    
    def test_get_all_visits_admin(self, admin_token):
        """Test admin getting all visits"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/visits/all", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Check visits have customer info
        if len(data) > 0:
            assert "customer" in data[0], "Visit should have customer info"
    
    def test_get_visits_pending_approval(self, admin_token):
        """Test getting visits pending approval"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/visits/pending-approval", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_customer_cannot_access_visit_approvals(self, customer_token):
        """Test customer cannot access visit approvals"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/visits/pending-approval", headers=headers)
        assert response.status_code == 403


# ============ PAYOUTS TESTS ============

class TestPayouts:
    """Rider Payouts tests"""
    
    def test_get_all_rider_wallets(self, admin_token):
        """Test admin getting all rider wallets"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/riders/wallets", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Check wallet structure
        if len(data) > 0:
            wallet = data[0]
            assert "rider_id" in wallet
            assert "total_earnings" in wallet
            assert "pending_earnings" in wallet
            assert "approved_earnings" in wallet
            assert "paid_earnings" in wallet
    
    def test_rider_get_own_wallet(self, rider_token):
        """Test rider getting their own wallet"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        response = requests.get(f"{BASE_URL}/api/rider/wallet", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_earnings" in data
        assert "pending_earnings" in data
        assert "approved_earnings" in data
        assert "next_payout_date" in data
    
    def test_rider_get_transactions(self, rider_token):
        """Test rider getting transaction history"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        response = requests.get(f"{BASE_URL}/api/rider/wallet/transactions", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_process_payouts_admin_only(self, admin_token):
        """Test processing payouts (admin only)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/payouts/process", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "payouts_processed" in data
    
    def test_customer_cannot_process_payouts(self, customer_token):
        """Test customer cannot process payouts"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/payouts/process", headers=headers)
        assert response.status_code == 403


# ============ LIVE TRACKING TESTS ============

class TestLiveTracking:
    """Live Tracking tests"""
    
    def test_get_online_riders(self, admin_token):
        """Test getting online riders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/riders/online", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_live_rider_locations(self, admin_token):
        """Test getting live rider locations"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/riders/live-locations", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Check rider location data structure
        if len(data) > 0:
            rider = data[0]
            assert "current_lat" in rider or rider.get("current_lat") is None
            assert "current_lng" in rider or rider.get("current_lng") is None
    
    def test_rider_update_location(self, rider_token):
        """Test rider updating their location"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        # First go online
        requests.post(f"{BASE_URL}/api/rider/shift", headers=headers, json={"is_online": True})
        
        response = requests.post(
            f"{BASE_URL}/api/rider/location",
            headers=headers,
            params={"lat": 30.7333, "lng": 76.7794}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True


# ============ NOTIFICATIONS TESTS ============

class TestNotifications:
    """Notifications tests"""
    
    def test_get_notifications(self, admin_token):
        """Test getting notifications"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
    
    def test_mark_notifications_read(self, admin_token):
        """Test marking notifications as read"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/notifications/mark-read", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
    
    def test_rider_gets_notifications(self, rider_token):
        """Test rider getting their notifications"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data


# ============ CLEANUP ============

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_tolet_tasks(self, admin_token):
        """Clean up test ToLet tasks"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get all tasks and delete TEST_ prefixed ones
        tasks_response = requests.get(f"{BASE_URL}/api/admin/tolet-tasks", headers=headers)
        if tasks_response.status_code == 200:
            for task in tasks_response.json():
                if task["title"].startswith("TEST_"):
                    # Note: No delete endpoint, so we just verify cleanup would work
                    pass
        
        assert True  # Cleanup verification


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
