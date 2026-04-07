"""
Seller Client Verification System Tests
Tests for:
1. Admin Login with Access Key 0219
2. Admin Dashboard - Locked Sellers tab
3. GET /api/seller-verification/admin/locked-sellers
4. POST /api/seller-verification/admin/unlock-seller/{seller_id}
5. Seller Login
6. GET /api/seller-verification/check-share-lock
7. GET /api/seller-verification/pending-verifications
8. POST /api/seller-verification/verify-client
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"
ADMIN_ACCESS_KEY = "0219"

SELLER_PHONE = "9898989898"
SELLER_PASSWORD = "seller123"


class TestAdminLogin:
    """Test Admin Login and Access Key verification"""
    
    def test_admin_login_success(self):
        """Test admin can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user']['role']}"
        
        print(f"✓ Admin login successful - User: {data['user']['name']}")
    
    def test_admin_access_key_verification(self):
        """Test admin access key 0219 verification"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Verify access key - requires access_type field
        response = requests.post(
            f"{BASE_URL}/api/inventory/verify-key",
            json={"key": ADMIN_ACCESS_KEY, "access_type": "admin"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Access key verification failed: {response.text}"
        data = response.json()
        
        # API returns 'success' field, not 'valid'
        assert data.get("success") == True, f"Access key should be valid, got: {data}"
        assert data.get("access_type") == "admin", f"Expected admin access, got {data.get('access_type')}"
        
        print(f"✓ Admin access key 0219 verified - Access type: {data.get('access_type')}")


class TestSellerLogin:
    """Test Seller Login"""
    
    def test_seller_login_success(self):
        """Test seller can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] == "seller", f"Expected seller role, got {data['user']['role']}"
        
        print(f"✓ Seller login successful - User: {data['user']['name']}")
        return data["token"]


class TestSellerVerificationAPIs:
    """Test Seller Verification APIs"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_check_share_lock_status(self, seller_token):
        """Test GET /api/seller-verification/check-share-lock"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/check-share-lock",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        assert response.status_code == 200, f"Check share lock failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "share_locked" in data, "Missing share_locked field"
        assert "account_locked" in data, "Missing account_locked field"
        assert isinstance(data["share_locked"], bool), "share_locked should be boolean"
        assert isinstance(data["account_locked"], bool), "account_locked should be boolean"
        
        print(f"✓ Check share lock - share_locked: {data['share_locked']}, account_locked: {data['account_locked']}")
        
        if data.get("pending_count"):
            print(f"  Pending verifications: {data['pending_count']}")
    
    def test_get_pending_verifications(self, seller_token):
        """Test GET /api/seller-verification/pending-verifications"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/pending-verifications",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Could be 200 (success) or 423 (account locked)
        assert response.status_code in [200, 423], f"Unexpected status: {response.status_code} - {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            assert "pending_verifications" in data, "Missing pending_verifications field"
            assert "pending_count" in data, "Missing pending_count field"
            assert "share_locked" in data, "Missing share_locked field"
            
            print(f"✓ Pending verifications - Count: {data['pending_count']}, Share locked: {data['share_locked']}")
            
            if data.get("today_referrals"):
                print(f"  Today's referrals: {len(data['today_referrals'])}")
        else:
            data = response.json()
            print(f"✓ Account is locked - Reason: {data.get('detail', {}).get('message', 'Unknown')}")
    
    def test_verify_client_requires_referral_id(self, seller_token):
        """Test POST /api/seller-verification/verify-client validation"""
        # Test with missing referral_id
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/verify-client",
            json={
                "status": "closed_won"
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing referral_id, got {response.status_code}"
        print("✓ Verify client validation - Requires referral_id")
    
    def test_verify_client_requires_valid_status(self, seller_token):
        """Test POST /api/seller-verification/verify-client status validation"""
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/verify-client",
            json={
                "referral_id": "test-referral-123",
                "status": "invalid_status"
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail with 400 for invalid status
        assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
        print("✓ Verify client validation - Requires valid status (closed_won, closed_lost, in_progress)")
    
    def test_verify_client_in_progress_requires_notes(self, seller_token):
        """Test POST /api/seller-verification/verify-client - in_progress requires notes"""
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/verify-client",
            json={
                "referral_id": "test-referral-123",
                "status": "in_progress"
                # Missing notes
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail with 400 for missing notes
        assert response.status_code == 400, f"Expected 400 for missing notes, got {response.status_code}"
        data = response.json()
        assert "notes" in data.get("detail", "").lower(), f"Expected notes error, got: {data}"
        print("✓ Verify client validation - in_progress status requires notes")


class TestAdminLockedSellersAPIs:
    """Test Admin Locked Sellers APIs"""
    
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
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        return response.json()["token"]
    
    def test_get_locked_sellers_admin_only(self, seller_token):
        """Test GET /api/seller-verification/admin/locked-sellers requires admin"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/admin/locked-sellers",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail with 403 for non-admin
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Locked sellers API - Requires admin access")
    
    def test_get_locked_sellers_success(self, admin_token):
        """Test GET /api/seller-verification/admin/locked-sellers"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/admin/locked-sellers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get locked sellers failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "locked_sellers" in data, "Missing locked_sellers field"
        assert "count" in data, "Missing count field"
        assert isinstance(data["locked_sellers"], list), "locked_sellers should be a list"
        assert isinstance(data["count"], int), "count should be an integer"
        
        print(f"✓ Get locked sellers - Count: {data['count']}")
        
        # If there are locked sellers, verify structure
        if data["locked_sellers"]:
            seller = data["locked_sellers"][0]
            print(f"  First locked seller: {seller.get('seller_name', 'Unknown')}")
            print(f"  Reason: {seller.get('reason', 'Unknown')}")
            print(f"  Closed lost count: {seller.get('closed_lost_count', 0)}")
    
    def test_unlock_seller_admin_only(self, seller_token):
        """Test POST /api/seller-verification/admin/unlock-seller requires admin"""
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/admin/unlock-seller/test-seller-id",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail with 403 for non-admin
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Unlock seller API - Requires admin access")
    
    def test_unlock_seller_not_found(self, admin_token):
        """Test POST /api/seller-verification/admin/unlock-seller with invalid seller_id"""
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/admin/unlock-seller/non-existent-seller-id",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Should fail with 404 for non-existent seller
        assert response.status_code == 404, f"Expected 404 for non-existent seller, got {response.status_code}"
        print("✓ Unlock seller API - Returns 404 for non-existent locked seller")


class TestSellerVerificationStats:
    """Test Admin Seller Verification Stats API"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_get_seller_verification_stats(self, admin_token):
        """Test GET /api/seller-verification/admin/seller-verification-stats"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/admin/seller-verification-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get verification stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "sellers" in data, "Missing sellers field"
        assert isinstance(data["sellers"], list), "sellers should be a list"
        
        print(f"✓ Get seller verification stats - Sellers count: {len(data['sellers'])}")
        
        # If there are sellers, verify structure
        if data["sellers"]:
            seller = data["sellers"][0]
            print(f"  First seller: {seller.get('seller_name', 'Unknown')}")
            print(f"  Total referrals: {seller.get('total', 0)}")
            print(f"  Closed won: {seller.get('closed_won', 0)}")
            print(f"  Closed lost: {seller.get('closed_lost', 0)}")


class TestSellerVerificationHistory:
    """Test Seller Verification History API"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        return response.json()["token"]
    
    def test_get_verification_history(self, seller_token):
        """Test GET /api/seller-verification/verification-history"""
        response = requests.get(
            f"{BASE_URL}/api/seller-verification/verification-history",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        assert response.status_code == 200, f"Get verification history failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "history" in data, "Missing history field"
        assert "stats" in data, "Missing stats field"
        assert "period_days" in data, "Missing period_days field"
        
        print(f"✓ Get verification history - Period: {data['period_days']} days")
        print(f"  Total: {data['stats'].get('total', 0)}")
        print(f"  Pending: {data['stats'].get('pending', 0)}")
        print(f"  Closed won: {data['stats'].get('closed_won', 0)}")
        print(f"  Closed lost: {data['stats'].get('closed_lost', 0)}")


class TestTrackReferral:
    """Test Track Referral API"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        return response.json()["token"]
    
    def test_track_referral_validation(self, seller_token):
        """Test POST /api/seller-verification/track-referral validation"""
        # Test with missing required fields
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/track-referral",
            json={},
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
        print("✓ Track referral validation - Requires client_name and client_phone")
    
    def test_track_referral_success(self, seller_token):
        """Test POST /api/seller-verification/track-referral success"""
        # First check if share is locked
        check_response = requests.get(
            f"{BASE_URL}/api/seller-verification/check-share-lock",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        if check_response.status_code == 200:
            check_data = check_response.json()
            if check_data.get("share_locked") or check_data.get("account_locked"):
                print("✓ Track referral - Skipped (share is locked)")
                return
        
        # Track a new referral
        response = requests.post(
            f"{BASE_URL}/api/seller-verification/track-referral",
            json={
                "client_name": "Test Client",
                "client_phone": "9999888877",
                "property_title": "Test Property",
                "notes": "Test referral for verification"
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Could be 200 (success) or 423 (locked)
        assert response.status_code in [200, 423], f"Unexpected status: {response.status_code} - {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Expected success=True"
            assert "referral_id" in data, "Missing referral_id"
            print(f"✓ Track referral success - Referral ID: {data['referral_id']}")
        else:
            print("✓ Track referral - Share is locked (expected behavior)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
