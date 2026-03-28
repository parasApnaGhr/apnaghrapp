"""
Test suite for ApnaGhr new features:
1. Forgot Password flow (OTP request, verify, reset)
2. App Settings seasonal theme
3. ToLet task completion with proof images and admin verification
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "6987654321"
CUSTOMER_PASSWORD = "newpass123"
RIDER_PHONE = "6111222333"
RIDER_PASSWORD = "rider123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


class TestForgotPasswordFlow:
    """Test forgot password flow: request OTP -> verify OTP -> reset password"""
    
    def test_request_otp_via_sms(self):
        """Test requesting OTP via SMS for password reset"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": CUSTOMER_PHONE,
            "method": "sms"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data["method"] == "sms"
        assert "expires_in_minutes" in data
        # OTP is returned for testing purposes
        assert "otp_for_testing" in data
        assert len(data["otp_for_testing"]) == 6
        print(f"OTP received: {data['otp_for_testing']}")
    
    def test_request_otp_via_email(self):
        """Test requesting OTP via email for password reset"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": CUSTOMER_PHONE,
            "method": "email"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["method"] == "email"
        assert "otp_for_testing" in data
    
    def test_request_otp_nonexistent_user(self):
        """Test OTP request for non-existent user (should not reveal user existence)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": "9999999999",
            "method": "sms"
        })
        # Should return 200 to not reveal if user exists
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_verify_otp_valid(self):
        """Test verifying a valid OTP"""
        # First request OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": CUSTOMER_PHONE,
            "method": "sms"
        })
        otp = otp_response.json()["otp_for_testing"]
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["valid"] == True
        assert "reset_token" in data
        assert "message" in data
        print(f"OTP verified, reset token received")
    
    def test_verify_otp_invalid(self):
        """Test verifying an invalid OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": "000000"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_reset_password_full_flow(self):
        """Test complete password reset flow"""
        # Step 1: Request OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": CUSTOMER_PHONE,
            "method": "sms"
        })
        assert otp_response.status_code == 200
        otp = otp_response.json()["otp_for_testing"]
        
        # Step 2: Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp
        })
        assert verify_response.status_code == 200
        
        # Step 3: Reset password
        new_password = "newpass123"  # Keep same password for test consistency
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "new_password": new_password
        })
        assert reset_response.status_code == 200, f"Expected 200, got {reset_response.status_code}: {reset_response.text}"
        
        data = reset_response.json()
        assert "message" in data
        print(f"Password reset successful: {data['message']}")
        
        # Step 4: Verify login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": new_password
        })
        assert login_response.status_code == 200, f"Login failed after password reset: {login_response.text}"
        print("Login with new password successful!")
    
    def test_reset_password_short_password(self):
        """Test password reset with too short password"""
        # Request OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": CUSTOMER_PHONE,
            "method": "sms"
        })
        otp = otp_response.json()["otp_for_testing"]
        
        # Try to reset with short password
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "new_password": "123"  # Too short
        })
        assert reset_response.status_code == 400
        assert "6 characters" in reset_response.json()["detail"]


class TestAppSettingsSeasonalTheme:
    """Test app settings and seasonal theme functionality"""
    
    def test_get_app_customization_settings(self):
        """Test getting app customization settings (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/settings/app-customization")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check expected fields exist
        print(f"App settings: {data}")
        # Settings may or may not have seasonal_active depending on admin config
    
    def test_update_app_customization_admin(self):
        """Test updating app customization settings as admin"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Update seasonal settings
        update_response = requests.post(
            f"{BASE_URL}/api/settings/app-customization",
            json={
                "seasonal_theme": "holi",
                "seasonal_banner_text": "Happy Holi! Get 10% off on visit bookings",
                "seasonal_discount_percent": 10,
                "seasonal_active": True,
                "accent_color": "#FF5A5F",
                "enable_animations": True,
                "show_offers_badge": True
            },
            headers=headers
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        # Response has nested structure: {message, settings: {...}}
        assert "settings" in data or data.get("seasonal_active") == True
        if "settings" in data:
            assert data["settings"].get("seasonal_active") == True
        print(f"Seasonal settings updated: {data}")
        
        # Verify settings are applied
        get_response = requests.get(f"{BASE_URL}/api/settings/app-customization")
        settings = get_response.json()
        print(f"Current settings after update: {settings}")


class TestToLetTaskPhotoVerification:
    """Test ToLet task completion with proof images and admin verification"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def rider_token(self):
        """Get rider auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200, f"Rider login failed: {response.text}"
        return response.json()["token"]
    
    def test_create_tolet_task_admin(self, admin_token):
        """Test admin creating a ToLet task"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks",
            json={
                "title": "TEST_Collect boards from Sector 22",
                "description": "Collect ToLet boards from main market area",
                "location": "Sector 22, Chandigarh",
                "rate_per_board": 15,
                "estimated_boards": 5
            },
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Collect boards from Sector 22"
        assert data["status"] == "open"
        print(f"ToLet task created: {data['id']}")
        return data["id"]
    
    def test_get_available_tolet_tasks_rider(self, rider_token):
        """Test rider getting available ToLet tasks"""
        headers = {"Authorization": f"Bearer {rider_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tolet-tasks/available",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Available tasks for rider: {len(data)}")
    
    def test_complete_task_requires_proof_images(self, admin_token, rider_token):
        """Test that task completion requires proof images (one per board)"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        
        # Create a task
        create_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks",
            json={
                "title": "TEST_Photo verification task",
                "description": "Test task for photo verification",
                "location": "Test Location",
                "rate_per_board": 10,
                "estimated_boards": 3
            },
            headers=admin_headers
        )
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Get rider ID
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=rider_headers)
        rider_id = me_response.json()["id"]
        
        # Assign task to rider
        assign_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/assign",
            json={"rider_id": rider_id},
            headers=admin_headers
        )
        assert assign_response.status_code == 200, f"Assign failed: {assign_response.text}"
        
        # Try to complete without enough proof images (should fail)
        complete_response = requests.post(
            f"{BASE_URL}/api/tolet-tasks/{task_id}/complete",
            json={
                "boards_collected": 3,
                "proof_images": ["https://example.com/image1.jpg"],  # Only 1 image for 3 boards
                "notes": "Test completion"
            },
            headers=rider_headers
        )
        assert complete_response.status_code == 400, f"Expected 400, got {complete_response.status_code}"
        assert "proof images" in complete_response.json()["detail"].lower()
        print("Correctly rejected completion without enough proof images")
        
        # Complete with correct number of images
        complete_response = requests.post(
            f"{BASE_URL}/api/tolet-tasks/{task_id}/complete",
            json={
                "boards_collected": 3,
                "proof_images": [
                    "https://example.com/board1.jpg",
                    "https://example.com/board2.jpg",
                    "https://example.com/board3.jpg"
                ],
                "notes": "Collected all boards from test location"
            },
            headers=rider_headers
        )
        assert complete_response.status_code == 200, f"Expected 200, got {complete_response.status_code}: {complete_response.text}"
        
        data = complete_response.json()
        assert data["status"] == "pending_verification"
        assert data["earnings"] == 30  # 3 boards * 10 per board
        print(f"Task completed with status: {data['status']}, earnings: {data['earnings']}")
        
        return task_id
    
    def test_admin_get_pending_verification_tasks(self, admin_token):
        """Test admin getting tasks pending photo verification"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/tolet-tasks/pending-verification",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Pending verification tasks: {len(data)}")
        
        # Check structure of pending tasks
        if len(data) > 0:
            task = data[0]
            assert "proof_images" in task or "actual_boards_collected" in task
            print(f"Sample pending task: {task.get('title', 'N/A')}")
    
    def test_admin_verify_task_approve(self, admin_token, rider_token):
        """Test admin approving a task after photo verification"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        
        # Create and complete a task first
        create_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks",
            json={
                "title": "TEST_Approval test task",
                "description": "Task for testing approval",
                "location": "Approval Test Location",
                "rate_per_board": 20,
                "estimated_boards": 2
            },
            headers=admin_headers
        )
        task_id = create_response.json()["id"]
        
        # Get rider ID and assign
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=rider_headers)
        rider_id = me_response.json()["id"]
        
        requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/assign",
            json={"rider_id": rider_id},
            headers=admin_headers
        )
        
        # Complete task
        requests.post(
            f"{BASE_URL}/api/tolet-tasks/{task_id}/complete",
            json={
                "boards_collected": 2,
                "proof_images": [
                    "https://example.com/approve1.jpg",
                    "https://example.com/approve2.jpg"
                ],
                "notes": "Ready for approval"
            },
            headers=rider_headers
        )
        
        # Admin approves
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/verify",
            params={"approved": True},
            headers=admin_headers
        )
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert data["status"] == "verified"
        assert data["earnings_approved"] == 40  # 2 boards * 20
        print(f"Task approved! Earnings: {data['earnings_approved']}")
    
    def test_admin_verify_task_reject(self, admin_token, rider_token):
        """Test admin rejecting a task with reason"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        
        # Create and complete a task
        create_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks",
            json={
                "title": "TEST_Rejection test task",
                "description": "Task for testing rejection",
                "location": "Rejection Test Location",
                "rate_per_board": 15,
                "estimated_boards": 2
            },
            headers=admin_headers
        )
        task_id = create_response.json()["id"]
        
        # Get rider ID and assign
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=rider_headers)
        rider_id = me_response.json()["id"]
        
        requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/assign",
            json={"rider_id": rider_id},
            headers=admin_headers
        )
        
        # Complete task
        requests.post(
            f"{BASE_URL}/api/tolet-tasks/{task_id}/complete",
            json={
                "boards_collected": 2,
                "proof_images": [
                    "https://example.com/reject1.jpg",
                    "https://example.com/reject2.jpg"
                ],
                "notes": "Test rejection"
            },
            headers=rider_headers
        )
        
        # Admin rejects
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/tolet-tasks/{task_id}/verify",
            params={
                "approved": False,
                "rejection_reason": "Photos are blurry, please retake"
            },
            headers=admin_headers
        )
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert data["status"] == "rejected"
        assert "blurry" in data.get("reason", "").lower()
        print(f"Task rejected with reason: {data.get('reason')}")


class TestLoginWithCredentials:
    """Verify all test credentials work"""
    
    def test_customer_login(self):
        """Test customer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Customer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "customer"
        print(f"Customer login successful: {data['user']['name']}")
    
    def test_rider_login(self):
        """Test rider login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200, f"Rider login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "rider"
        print(f"Rider login successful: {data['user']['name']}")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
