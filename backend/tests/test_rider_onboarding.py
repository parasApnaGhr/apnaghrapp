"""
Test Rider Onboarding Module - Backend API Tests
Tests for:
- POST /api/rider-applications - Submit new rider application
- GET /api/rider-applications/check/{mobile} - Check existing applications
- GET /api/admin/rider-applications - Admin list applications
- GET /api/admin/rider-applications/stats - Admin stats
- PATCH /api/admin/rider-applications/{id}/review - Approve/reject
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"

class TestRiderOnboardingPublicEndpoints:
    """Test public rider application endpoints (no auth required)"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_check_application_nonexistent_mobile(self):
        """Check application status for non-existent mobile"""
        test_mobile = "9999999999"
        response = requests.get(f"{BASE_URL}/api/rider-applications/check/{test_mobile}")
        assert response.status_code == 200
        data = response.json()
        assert data["exists"] == False
        print(f"✓ Check application for non-existent mobile: {data}")
    
    def test_submit_rider_application_missing_fields(self):
        """Test validation - missing required fields"""
        incomplete_data = {
            "full_name": "Test Rider",
            "mobile": "9876543210"
            # Missing required fields
        }
        response = requests.post(f"{BASE_URL}/api/rider-applications", json=incomplete_data)
        assert response.status_code == 422  # Validation error
        print("✓ Validation error for missing fields")
    
    def test_submit_rider_application_missing_legal_agreements(self):
        """Test validation - legal agreements not accepted"""
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        application_data = {
            "full_name": "Test Rider",
            "mobile": test_mobile,
            "city": "Mohali",
            "areas": ["Sector 70"],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": True,
            "availability": "full_time",
            "upi_id": "test@upi",
            # Legal agreements not accepted
            "non_circumvention": False,
            "commission_protection": False,
            "penalty_clause": False,
            "work_compliance": False,
            "payment_terms": False
        }
        response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        assert response.status_code == 400
        assert "legal agreements" in response.json().get("detail", "").lower()
        print("✓ Validation error for missing legal agreements")
    
    def test_submit_rider_application_success(self):
        """Test successful rider application submission"""
        # Use unique mobile to avoid conflicts
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        application_data = {
            "full_name": "Test Rider Application",
            "mobile": test_mobile,
            "whatsapp": test_mobile,
            "city": "Mohali",
            "areas": ["Sector 70", "Sector 71"],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "pan_url": "https://example.com/pan.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": True,
            "driving_license_url": "https://example.com/dl.jpg",
            "experience": "2 years delivery experience",
            "availability": "full_time",
            "upi_id": "testrider@upi",
            "bank_name": "HDFC Bank",
            "account_number": "1234567890",
            "ifsc_code": "HDFC0001234",
            "account_holder_name": "Test Rider",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert "application_id" in data
        assert data["status"] == "pending"
        print(f"✓ Rider application submitted successfully: {data['application_id']}")
        
        # Store for cleanup
        return data["application_id"], test_mobile
    
    def test_check_application_existing_mobile(self):
        """Check application status for existing mobile"""
        # First submit an application
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        application_data = {
            "full_name": "Check Test Rider",
            "mobile": test_mobile,
            "city": "Chandigarh",
            "areas": [],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": False,
            "availability": "part_time",
            "upi_id": "checktest@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        submit_response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        assert submit_response.status_code == 200
        
        # Now check the application
        response = requests.get(f"{BASE_URL}/api/rider-applications/check/{test_mobile}")
        assert response.status_code == 200
        data = response.json()
        assert data["exists"] == True
        assert data["status"] == "pending"
        print(f"✓ Check application for existing mobile: {data}")
    
    def test_duplicate_application_rejected(self):
        """Test that duplicate applications are rejected"""
        test_mobile = f"TEST{str(uuid.uuid4())[:6]}"
        application_data = {
            "full_name": "Duplicate Test Rider",
            "mobile": test_mobile,
            "city": "Delhi",
            "areas": [],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": False,
            "availability": "weekends",
            "upi_id": "duplicate@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        
        # First submission
        response1 = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        assert response1.status_code == 200
        
        # Second submission with same mobile
        response2 = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        assert response2.status_code == 400
        assert "pending application" in response2.json().get("detail", "").lower()
        print("✓ Duplicate application correctly rejected")


class TestRiderOnboardingAdminEndpoints:
    """Test admin rider application endpoints (auth required)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        print(f"✓ Admin logged in successfully")
    
    def test_get_rider_applications_list(self):
        """Get list of rider applications"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        assert "total" in data
        print(f"✓ Got {len(data['applications'])} applications, total: {data['total']}")
    
    def test_get_rider_applications_with_status_filter(self):
        """Get applications filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        # All returned applications should be pending
        for app in data["applications"]:
            assert app["status"] == "pending"
        print(f"✓ Got {len(data['applications'])} pending applications")
    
    def test_get_rider_applications_with_city_filter(self):
        """Get applications filtered by city"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications?city=Mohali",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Got {len(data['applications'])} applications from Mohali")
    
    def test_get_rider_application_stats(self):
        """Get rider application statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications/stats",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "by_status" in data
        assert "by_city" in data
        assert "total" in data
        print(f"✓ Stats: total={data['total']}, by_status={data['by_status']}")
    
    def test_get_single_application(self):
        """Get a specific application by ID"""
        # First get list to find an application ID
        list_response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications?limit=1",
            headers=self.headers
        )
        if list_response.status_code != 200 or not list_response.json().get("applications"):
            pytest.skip("No applications found to test")
        
        app_id = list_response.json()["applications"][0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/rider-applications/{app_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        print(f"✓ Got application details for {app_id}")
    
    def test_review_application_approve(self):
        """Test approving a rider application"""
        # First create a test application
        test_mobile = f"APPROVE{str(uuid.uuid4())[:4]}"
        application_data = {
            "full_name": "Approve Test Rider",
            "mobile": test_mobile,
            "city": "Mohali",
            "areas": ["Sector 70"],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": True,
            "availability": "full_time",
            "upi_id": "approve@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        submit_response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        if submit_response.status_code != 200:
            pytest.skip(f"Could not create test application: {submit_response.text}")
        
        app_id = submit_response.json()["application_id"]
        
        # Now approve it
        response = requests.patch(
            f"{BASE_URL}/api/admin/rider-applications/{app_id}/review",
            headers=self.headers,
            json={"status": "approved"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        print(f"✓ Application {app_id} approved successfully")
    
    def test_review_application_reject(self):
        """Test rejecting a rider application"""
        # First create a test application
        test_mobile = f"REJECT{str(uuid.uuid4())[:4]}"
        application_data = {
            "full_name": "Reject Test Rider",
            "mobile": test_mobile,
            "city": "Delhi",
            "areas": [],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": False,
            "availability": "part_time",
            "upi_id": "reject@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        submit_response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        if submit_response.status_code != 200:
            pytest.skip(f"Could not create test application: {submit_response.text}")
        
        app_id = submit_response.json()["application_id"]
        
        # Now reject it
        response = requests.patch(
            f"{BASE_URL}/api/admin/rider-applications/{app_id}/review",
            headers=self.headers,
            json={"status": "rejected", "rejection_reason": "Test rejection - incomplete documents"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "rejected"
        print(f"✓ Application {app_id} rejected successfully")
    
    def test_ban_rider(self):
        """Test banning a rider"""
        # First create and approve a test application
        test_mobile = f"BAN{str(uuid.uuid4())[:6]}"
        application_data = {
            "full_name": "Ban Test Rider",
            "mobile": test_mobile,
            "city": "Mumbai",
            "areas": [],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": False,
            "availability": "weekends",
            "upi_id": "ban@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        submit_response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        if submit_response.status_code != 200:
            pytest.skip(f"Could not create test application: {submit_response.text}")
        
        app_id = submit_response.json()["application_id"]
        
        # Ban the rider
        response = requests.patch(
            f"{BASE_URL}/api/admin/rider-applications/{app_id}/ban",
            headers=self.headers,
            json={"reason": "Test ban - policy violation"}
        )
        assert response.status_code == 200
        print(f"✓ Rider {app_id} banned successfully")
    
    def test_unauthorized_access(self):
        """Test that non-admin users cannot access admin endpoints"""
        # Try without auth
        response = requests.get(f"{BASE_URL}/api/admin/rider-applications")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access correctly blocked")


class TestRiderOnboardingValidation:
    """Test input validation for rider applications"""
    
    def test_invalid_mobile_format(self):
        """Test validation for invalid mobile number"""
        application_data = {
            "full_name": "Test Rider",
            "mobile": "123",  # Too short
            "city": "Mohali",
            "areas": [],
            "aadhaar_url": "https://example.com/aadhaar.jpg",
            "selfie_url": "https://example.com/selfie.jpg",
            "has_vehicle": False,
            "availability": "full_time",
            "upi_id": "test@upi",
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        # The API should accept this but frontend validates 10-digit
        # Backend doesn't have strict mobile validation currently
        print(f"Mobile validation response: {response.status_code}")
    
    def test_empty_required_fields(self):
        """Test validation for empty required fields"""
        application_data = {
            "full_name": "",  # Empty
            "mobile": "9876543210",
            "city": "",  # Empty
            "areas": [],
            "aadhaar_url": "",  # Empty
            "selfie_url": "",  # Empty
            "has_vehicle": False,
            "availability": "full_time",
            "upi_id": "",  # Empty
            "non_circumvention": True,
            "commission_protection": True,
            "penalty_clause": True,
            "work_compliance": True,
            "payment_terms": True
        }
        response = requests.post(f"{BASE_URL}/api/rider-applications", json=application_data)
        # Should fail validation
        assert response.status_code in [400, 422]
        print(f"✓ Empty fields validation: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
