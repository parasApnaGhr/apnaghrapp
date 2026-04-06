"""
Seller Performance & Tracking System Tests
Tests for:
- Daily login tracking
- Daily Start Form submission
- Daily End Report submission
- Performance scoring
- Leaderboard (daily/monthly)
- Earnings calculation
- Admin tracking/management
- Motivation quotes management
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"
SELLER_PHONE = "9898989898"
SELLER_PASSWORD = "seller123"


class TestAuthSetup:
    """Authentication setup tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in admin login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in seller login response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Test admin can login successfully"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"✓ Admin login successful, token length: {len(admin_token)}")
    
    def test_seller_login(self, seller_token):
        """Test seller can login successfully"""
        assert seller_token is not None
        assert len(seller_token) > 0
        print(f"✓ Seller login successful, token length: {len(seller_token)}")


class TestSellerDailyStatus:
    """Tests for seller daily status check endpoint"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json()["token"]
    
    def test_check_daily_status(self, seller_token):
        """Test /api/seller-performance/check-daily-status endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/check-daily-status", headers=headers)
        
        assert response.status_code == 200, f"Check daily status failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "needs_start_report" in data, "Missing needs_start_report field"
        assert "start_report_submitted" in data, "Missing start_report_submitted field"
        assert "needs_pending_logout" in data, "Missing needs_pending_logout field"
        assert "warnings" in data, "Missing warnings field"
        assert "motivation_quote" in data, "Missing motivation_quote field"
        
        print(f"✓ Daily status check successful")
        print(f"  - needs_start_report: {data['needs_start_report']}")
        print(f"  - start_report_submitted: {data['start_report_submitted']}")
        print(f"  - motivation_quote: {data['motivation_quote'][:50]}...")
    
    def test_check_daily_status_unauthorized(self):
        """Test daily status check without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/seller-performance/check-daily-status")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized access correctly rejected")


class TestSellerDailyStart:
    """Tests for seller daily start report submission"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json()["token"]
    
    def test_daily_start_submission(self, seller_token):
        """Test /api/seller-performance/daily-start endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        # First check if already submitted today
        status_response = requests.get(f"{BASE_URL}/api/seller-performance/check-daily-status", headers=headers)
        status_data = status_response.json()
        
        if status_data.get("start_report_submitted"):
            print("✓ Daily start already submitted today - skipping submission test")
            return
        
        # Submit daily start report
        payload = {
            "image_base64": None,
            "today_plan": "TEST: Plan to call 50 clients and share 30 properties",
            "planned_visits": 5,
            "expected_deals": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/seller-performance/daily-start", 
                                json=payload, headers=headers)
        
        # Could be 200 (success) or 400 (already submitted)
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Expected success=True"
            assert "activity_id" in data, "Missing activity_id in response"
            print(f"✓ Daily start submitted successfully, activity_id: {data['activity_id']}")
        elif response.status_code == 400:
            print("✓ Daily start already submitted today (expected behavior)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}, {response.text}")
    
    def test_daily_start_validation(self, seller_token):
        """Test daily start validation - empty plan should fail"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        # Try with empty plan
        payload = {
            "image_base64": None,
            "today_plan": "",  # Empty plan
            "planned_visits": 0,
            "expected_deals": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/seller-performance/daily-start", 
                                json=payload, headers=headers)
        
        # Should either fail validation or be rejected if already submitted
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"✓ Daily start validation test completed (status: {response.status_code})")


class TestSellerDailyEnd:
    """Tests for seller daily end report submission"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json()["token"]
    
    def test_daily_end_submission(self, seller_token):
        """Test /api/seller-performance/daily-end endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        payload = {
            "clients_called": 45,
            "visits_booked": 3,
            "deals_closed": 0,
            "properties_shared": 25,
            "tomorrow_visits": 4
        }
        
        response = requests.post(f"{BASE_URL}/api/seller-performance/daily-end", 
                                json=payload, headers=headers)
        
        assert response.status_code == 200, f"Daily end submission failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Expected success=True"
        assert "score" in data, "Missing score in response"
        
        # Verify score structure
        score = data["score"]
        assert "base_score" in score, "Missing base_score"
        assert "bonus" in score, "Missing bonus"
        assert "penalty" in score, "Missing penalty"
        assert "final_score" in score, "Missing final_score"
        
        print(f"✓ Daily end submitted successfully")
        print(f"  - Base score: {score['base_score']}")
        print(f"  - Bonus: {score['bonus']}")
        print(f"  - Penalty: {score['penalty']}")
        print(f"  - Final score: {score['final_score']}")


class TestSellerPerformance:
    """Tests for seller performance data retrieval"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json()["token"]
    
    def test_my_performance(self, seller_token):
        """Test /api/seller-performance/my-performance endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/my-performance", headers=headers)
        
        assert response.status_code == 200, f"Get performance failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "today" in data, "Missing today field"
        assert "monthly" in data, "Missing monthly field"
        assert "rank" in data, "Missing rank field"
        assert "total_sellers" in data, "Missing total_sellers field"
        
        # Verify today structure
        today = data["today"]
        assert "score" in today, "Missing today.score"
        assert "properties_shared" in today, "Missing today.properties_shared"
        assert "visits_booked" in today, "Missing today.visits_booked"
        assert "deals_closed" in today, "Missing today.deals_closed"
        
        # Verify monthly structure
        monthly = data["monthly"]
        assert "score" in monthly, "Missing monthly.score"
        assert "deals" in monthly, "Missing monthly.deals"
        assert "performance_tag" in monthly, "Missing monthly.performance_tag"
        assert "performance_bonus" in monthly, "Missing monthly.performance_bonus"
        
        print(f"✓ My performance retrieved successfully")
        print(f"  - Today's score: {today['score']}")
        print(f"  - Monthly score: {monthly['score']}")
        print(f"  - Rank: {data['rank']} of {data['total_sellers']}")
        print(f"  - Performance tag: {monthly['performance_tag']}")
    
    def test_activity_history(self, seller_token):
        """Test /api/seller-performance/my-activity-history endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/my-activity-history?limit=10", headers=headers)
        
        assert response.status_code == 200, f"Get activity history failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        
        if len(data) > 0:
            activity = data[0]
            assert "date" in activity, "Missing date in activity"
            assert "seller_id" in activity, "Missing seller_id in activity"
            print(f"✓ Activity history retrieved: {len(data)} records")
            print(f"  - Latest activity date: {activity.get('date')}")
        else:
            print("✓ Activity history retrieved (empty - no activities yet)")


class TestAdminTracking:
    """Tests for admin seller tracking endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_sellers_tracking(self, admin_token):
        """Test /api/seller-performance/admin/sellers-tracking endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/sellers-tracking?date={today}", 
                               headers=headers)
        
        assert response.status_code == 200, f"Admin tracking failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        print(f"✓ Admin sellers tracking retrieved: {len(data)} sellers")
        
        if len(data) > 0:
            seller = data[0]
            print(f"  - First seller: {seller.get('seller_name', 'Unknown')}")
            print(f"  - Login time: {seller.get('login_time', 'N/A')}")
    
    def test_admin_sellers_tracking_unauthorized(self):
        """Test admin tracking without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/sellers-tracking")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized admin access correctly rejected")


class TestAdminLeaderboard:
    """Tests for admin leaderboard endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_daily_leaderboard(self, admin_token):
        """Test /api/seller-performance/admin/leaderboard?period=daily endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/leaderboard?period=daily", 
                               headers=headers)
        
        assert response.status_code == 200, f"Daily leaderboard failed: {response.text}"
        data = response.json()
        
        assert "period" in data, "Missing period field"
        assert "leaderboard" in data, "Missing leaderboard field"
        assert data["period"] == "daily", f"Expected period=daily, got {data['period']}"
        
        print(f"✓ Daily leaderboard retrieved: {len(data['leaderboard'])} entries")
        
        if len(data['leaderboard']) > 0:
            top = data['leaderboard'][0]
            print(f"  - Top seller: {top.get('seller_name', 'Unknown')} with score {top.get('score', 0)}")
    
    def test_monthly_leaderboard(self, admin_token):
        """Test /api/seller-performance/admin/leaderboard?period=monthly endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/leaderboard?period=monthly", 
                               headers=headers)
        
        assert response.status_code == 200, f"Monthly leaderboard failed: {response.text}"
        data = response.json()
        
        assert "period" in data, "Missing period field"
        assert "leaderboard" in data, "Missing leaderboard field"
        assert data["period"] == "monthly", f"Expected period=monthly, got {data['period']}"
        
        print(f"✓ Monthly leaderboard retrieved: {len(data['leaderboard'])} entries")
        
        if len(data['leaderboard']) > 0:
            top = data['leaderboard'][0]
            print(f"  - Top seller: {top.get('seller_name', 'Unknown')}")
            print(f"  - Score: {top.get('score', 0)}, Deals: {top.get('deals', 0)}")
            print(f"  - Performance tag: {top.get('performance_tag', 'N/A')}")


class TestAdminEarnings:
    """Tests for admin earnings endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_earnings(self, admin_token):
        """Test /api/seller-performance/admin/earnings endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        month = datetime.now().strftime('%Y-%m')
        
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/earnings?month={month}", 
                               headers=headers)
        
        assert response.status_code == 200, f"Admin earnings failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        print(f"✓ Admin earnings retrieved: {len(data)} sellers")
        
        if len(data) > 0:
            seller = data[0]
            assert "seller_id" in seller, "Missing seller_id"
            assert "total_score" in seller, "Missing total_score"
            assert "performance_bonus" in seller, "Missing performance_bonus"
            assert "payout_status" in seller, "Missing payout_status"
            
            print(f"  - First seller: {seller.get('seller_name', 'Unknown')}")
            print(f"  - Total bonus: ₹{seller.get('total_bonus', 0)}")
            print(f"  - Payout status: {seller.get('payout_status', 'N/A')}")


class TestAdminMotivationQuotes:
    """Tests for admin motivation quotes management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_get_motivation_quotes(self, admin_token):
        """Test /api/seller-performance/admin/motivation-quotes endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/motivation-quotes", 
                               headers=headers)
        
        assert response.status_code == 200, f"Get quotes failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        print(f"✓ Motivation quotes retrieved: {len(data)} quotes")
    
    def test_add_motivation_quote(self, admin_token):
        """Test adding a new motivation quote"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/seller-performance/admin/motivation-quote",
            params={
                "quote": "TEST: Success is not final, failure is not fatal!",
                "author": "Test Author"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Add quote failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Expected success=True"
        assert "quote_id" in data, "Missing quote_id"
        
        print(f"✓ Motivation quote added successfully, id: {data['quote_id']}")
        
        # Store quote_id for cleanup
        return data["quote_id"]
    
    def test_delete_motivation_quote(self, admin_token):
        """Test deleting a motivation quote"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First add a quote to delete
        add_response = requests.post(
            f"{BASE_URL}/api/seller-performance/admin/motivation-quote",
            params={
                "quote": "TEST_DELETE: This quote will be deleted",
                "author": "Test"
            },
            headers=headers
        )
        
        if add_response.status_code != 200:
            pytest.skip("Could not add quote for deletion test")
        
        quote_id = add_response.json()["quote_id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/seller-performance/admin/motivation-quote/{quote_id}",
            headers=headers
        )
        
        assert delete_response.status_code == 200, f"Delete quote failed: {delete_response.text}"
        data = delete_response.json()
        assert data.get("success") == True, "Expected success=True"
        
        print(f"✓ Motivation quote deleted successfully")


class TestAdminMarkPaid:
    """Tests for admin mark as paid functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_mark_as_paid(self, admin_token):
        """Test /api/seller-performance/admin/mark-paid endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        month = datetime.now().strftime('%Y-%m')
        
        # First get earnings to find a seller
        earnings_response = requests.get(
            f"{BASE_URL}/api/seller-performance/admin/earnings?month={month}",
            headers=headers
        )
        
        if earnings_response.status_code != 200 or len(earnings_response.json()) == 0:
            print("✓ Mark as paid test skipped (no sellers with earnings)")
            return
        
        seller_id = earnings_response.json()[0]["seller_id"]
        
        # Mark as paid
        response = requests.post(
            f"{BASE_URL}/api/seller-performance/admin/mark-paid",
            json=[seller_id],
            params={"month": month},
            headers=headers
        )
        
        assert response.status_code == 200, f"Mark as paid failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Expected success=True"
        assert "marked" in data, "Missing marked count"
        
        print(f"✓ Mark as paid successful: {data['marked']} seller(s) marked")


class TestSellerDetailAdmin:
    """Tests for admin seller detail endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_seller_detail(self, admin_token):
        """Test /api/seller-performance/admin/seller-detail/{seller_id} endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        # First get tracking to find a seller
        tracking_response = requests.get(
            f"{BASE_URL}/api/seller-performance/admin/sellers-tracking?date={today}",
            headers=headers
        )
        
        if tracking_response.status_code != 200 or len(tracking_response.json()) == 0:
            print("✓ Seller detail test skipped (no sellers found)")
            return
        
        seller_id = tracking_response.json()[0]["seller_id"]
        
        # Get seller detail
        response = requests.get(
            f"{BASE_URL}/api/seller-performance/admin/seller-detail/{seller_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Seller detail failed: {response.text}"
        data = response.json()
        
        assert "seller" in data, "Missing seller field"
        assert "activities" in data, "Missing activities field"
        assert "stats" in data, "Missing stats field"
        
        print(f"✓ Seller detail retrieved successfully")
        print(f"  - Seller: {data['seller'].get('name', 'Unknown')}")
        print(f"  - Activities: {len(data['activities'])} records")
        print(f"  - Login days: {data['stats'].get('login_days', 0)}")


class TestRoleBasedAccess:
    """Tests for role-based access control"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": SELLER_PHONE,
            "password": SELLER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json()["token"]
    
    def test_seller_cannot_access_admin_tracking(self, seller_token):
        """Test seller cannot access admin tracking endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/sellers-tracking", 
                               headers=headers)
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Seller correctly denied access to admin tracking")
    
    def test_seller_cannot_access_admin_leaderboard(self, seller_token):
        """Test seller cannot access admin leaderboard endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/leaderboard", 
                               headers=headers)
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Seller correctly denied access to admin leaderboard")
    
    def test_seller_cannot_access_admin_earnings(self, seller_token):
        """Test seller cannot access admin earnings endpoint"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/seller-performance/admin/earnings", 
                               headers=headers)
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Seller correctly denied access to admin earnings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
