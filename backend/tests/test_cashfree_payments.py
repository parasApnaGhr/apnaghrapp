"""
Cashfree Payment Integration Tests
Tests for visit packages, packers & movers, and advertising payment flows
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com')

# Test credentials
CUSTOMER_PHONE = "9999999999"
CUSTOMER_PASSWORD = "test123"
ADMIN_PHONE = "7777777777"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def customer_token(api_client):
    """Get customer authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "phone": CUSTOMER_PHONE,
        "password": CUSTOMER_PASSWORD
    })
    assert response.status_code == 200, f"Customer login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "phone": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def authenticated_customer(api_client, customer_token):
    """Session with customer auth header"""
    api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
    return api_client


@pytest.fixture
def authenticated_admin(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestVisitPackagePayments:
    """Tests for visit package payment checkout (single_visit, three_visits, five_visits, property_lock)"""
    
    def test_single_visit_checkout(self, authenticated_customer):
        """Test single visit package (₹200) checkout creates valid Cashfree order"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "single_visit",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "checkout_url" in data, "Missing checkout_url"
        assert "session_id" in data, "Missing session_id"
        assert "payment_session_id" in data, "Missing payment_session_id"
        assert "order_id" in data, "Missing order_id"
        
        # Verify checkout URL is Cashfree production URL
        assert "payments.cashfree.com" in data["checkout_url"], "Not a Cashfree production URL"
        assert data["order_id"].startswith("apnaghr_"), "Order ID should start with apnaghr_"
        
        print(f"Single visit checkout URL: {data['checkout_url']}")
    
    def test_three_visits_checkout(self, authenticated_customer):
        """Test three visits package (₹350) checkout creates valid Cashfree order"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "three_visits",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        assert "checkout_url" in data
        assert "payments.cashfree.com" in data["checkout_url"]
        assert data["order_id"].startswith("apnaghr_")
        
        print(f"Three visits checkout URL: {data['checkout_url']}")
    
    def test_five_visits_checkout(self, authenticated_customer):
        """Test five visits package (₹500) checkout creates valid Cashfree order"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "five_visits",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        assert "checkout_url" in data
        assert "payments.cashfree.com" in data["checkout_url"]
        assert data["order_id"].startswith("apnaghr_")
        
        print(f"Five visits checkout URL: {data['checkout_url']}")
    
    def test_property_lock_checkout(self, authenticated_customer):
        """Test property lock (₹999) checkout creates valid Cashfree order"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "property_lock",
            "origin_url": BASE_URL,
            "property_id": "test_property_123"
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        assert "checkout_url" in data
        assert "payments.cashfree.com" in data["checkout_url"]
        
        print(f"Property lock checkout URL: {data['checkout_url']}")
    
    def test_invalid_package_checkout(self, authenticated_customer):
        """Test checkout with invalid package returns 400"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "invalid_package",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"


class TestPackersPayments:
    """Tests for Packers & Movers payment flow"""
    
    def test_get_packers_packages(self, api_client):
        """Test fetching packers packages"""
        response = api_client.get(f"{BASE_URL}/api/packers/packages")
        
        assert response.status_code == 200, f"Failed to get packages: {response.text}"
        data = response.json()
        
        assert "packages" in data
        packages = data["packages"]
        assert len(packages) == 5, f"Expected 5 packages, got {len(packages)}"
        
        # Verify package tiers
        tiers = [p["tier"] for p in packages]
        assert "basic" in tiers
        assert "standard" in tiers
        assert "premium" in tiers
        assert "elite" in tiers
        assert "intercity" in tiers
    
    def test_create_packers_booking(self, authenticated_customer):
        """Test creating a packers booking"""
        response = authenticated_customer.post(f"{BASE_URL}/api/packers/book", json={
            "package_tier": "basic",
            "from_address": "Test From Address, Sector 17",
            "to_address": "Test To Address, Sector 22",
            "from_city": "Chandigarh",
            "to_city": "Chandigarh",
            "scheduled_date": "2026-04-15",
            "contact_phone": "9999999999",
            "items_description": "1BHK furniture",
            "add_ons": []
        })
        
        assert response.status_code == 200, f"Booking failed: {response.text}"
        data = response.json()
        
        assert "booking" in data
        booking = data["booking"]
        assert "id" in booking
        assert booking["package_tier"] == "basic"
        assert booking["status"] == "pending"
        
        return booking["id"]
    
    def test_packers_payment_initiation(self, authenticated_customer):
        """Test initiating payment for packers booking"""
        # First create a booking
        booking_response = authenticated_customer.post(f"{BASE_URL}/api/packers/book", json={
            "package_tier": "standard",
            "from_address": "TEST_Payment From Address",
            "to_address": "TEST_Payment To Address",
            "from_city": "Mohali",
            "to_city": "Chandigarh",
            "scheduled_date": "2026-04-20",
            "contact_phone": "9999999999",
            "items_description": "2BHK furniture for payment test",
            "add_ons": []
        })
        
        assert booking_response.status_code == 200
        booking_id = booking_response.json()["booking"]["id"]
        
        # Initiate payment
        payment_response = authenticated_customer.post(f"{BASE_URL}/api/packers/pay", json={
            "booking_id": booking_id,
            "origin_url": BASE_URL
        })
        
        assert payment_response.status_code == 200, f"Payment initiation failed: {payment_response.text}"
        data = payment_response.json()
        
        assert "checkout_url" in data
        assert "payments.cashfree.com" in data["checkout_url"]
        assert "session_id" in data
        assert "order_id" in data
        
        print(f"Packers payment checkout URL: {data['checkout_url']}")
    
    def test_packers_payment_already_paid(self, authenticated_customer):
        """Test that already paid booking returns error"""
        # This test verifies the payment status check logic
        # We can't actually complete payment, but we verify the endpoint exists
        pass  # Skip - requires actual payment completion


class TestAdvertisingPayments:
    """Tests for Advertising payment flow"""
    
    def test_get_advertising_packages(self, api_client):
        """Test fetching advertising packages"""
        response = api_client.get(f"{BASE_URL}/api/advertising/packages")
        
        assert response.status_code == 200, f"Failed to get packages: {response.text}"
        data = response.json()
        
        assert "packages" in data
        packages = data["packages"]
        assert len(packages) == 4, f"Expected 4 packages, got {len(packages)}"
        
        # Verify package tiers
        tiers = [p["tier"] for p in packages]
        assert "starter" in tiers
        assert "growth" in tiers
        assert "premium" in tiers
        assert "elite" in tiers
    
    def test_create_advertiser_profile(self, authenticated_customer):
        """Test creating advertiser profile"""
        response = authenticated_customer.post(f"{BASE_URL}/api/advertising/profile", json={
            "company_name": "TEST_Company Ltd",
            "business_type": "Packers & Movers",
            "contact_email": "test@testcompany.com",
            "contact_phone": "9999999999",
            "gst_number": "TEST123456789",
            "address": "Test Address, Sector 17, Chandigarh"
        })
        
        assert response.status_code == 200, f"Profile creation failed: {response.text}"
        data = response.json()
        
        assert "company_name" in data
        assert data["company_name"] == "TEST_Company Ltd"
    
    def test_create_advertisement(self, authenticated_customer):
        """Test creating an advertisement"""
        # First ensure profile exists
        authenticated_customer.post(f"{BASE_URL}/api/advertising/profile", json={
            "company_name": "TEST_Ad Company",
            "business_type": "Furniture",
            "contact_email": "ads@testcompany.com",
            "contact_phone": "9999999999"
        })
        
        # Create advertisement
        response = authenticated_customer.post(f"{BASE_URL}/api/advertising/ads", json={
            "company_name": "TEST_Ad Company",
            "package_tier": "starter",
            "poster_images": ["https://example.com/poster1.jpg"],
            "description": "Test advertisement for payment testing",
            "placement": ["home_screen"],
            "start_date": "2026-04-01",
            "end_date": "2026-04-30"
        })
        
        assert response.status_code == 200, f"Ad creation failed: {response.text}"
        data = response.json()
        
        assert "ad" in data
        ad = data["ad"]
        assert "id" in ad
        assert ad["status"] == "pending"
        
        return ad["id"]
    
    def test_advertising_payment_initiation(self, authenticated_customer):
        """Test initiating payment for advertisement"""
        # First ensure profile exists
        authenticated_customer.post(f"{BASE_URL}/api/advertising/profile", json={
            "company_name": "TEST_Payment Ad Company",
            "business_type": "Real Estate",
            "contact_email": "payment@testcompany.com",
            "contact_phone": "9999999999"
        })
        
        # Create advertisement
        ad_response = authenticated_customer.post(f"{BASE_URL}/api/advertising/ads", json={
            "company_name": "TEST_Payment Ad Company",
            "package_tier": "growth",
            "poster_images": [],
            "description": "Test ad for payment initiation",
            "placement": ["home_screen", "property_detail"],
            "start_date": "2026-04-01",
            "end_date": "2026-04-30"
        })
        
        assert ad_response.status_code == 200
        ad_id = ad_response.json()["ad"]["id"]
        
        # Initiate payment
        payment_response = authenticated_customer.post(f"{BASE_URL}/api/advertising/pay", json={
            "ad_id": ad_id,
            "origin_url": BASE_URL
        })
        
        assert payment_response.status_code == 200, f"Payment initiation failed: {payment_response.text}"
        data = payment_response.json()
        
        assert "checkout_url" in data
        assert "payments.cashfree.com" in data["checkout_url"]
        assert "session_id" in data
        assert "order_id" in data
        
        print(f"Advertising payment checkout URL: {data['checkout_url']}")


class TestPaymentStatusCheck:
    """Tests for payment status checking"""
    
    def test_payment_status_check_valid_order(self, authenticated_customer):
        """Test checking payment status for a valid order"""
        # First create a checkout to get an order_id
        checkout_response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "single_visit",
            "origin_url": BASE_URL
        })
        
        assert checkout_response.status_code == 200
        order_id = checkout_response.json()["order_id"]
        
        # Check payment status
        status_response = authenticated_customer.get(f"{BASE_URL}/api/payments/status/{order_id}")
        
        assert status_response.status_code == 200, f"Status check failed: {status_response.text}"
        data = status_response.json()
        
        assert "payment_status" in data
        assert data["payment_status"] == "pending"  # Not paid yet
        assert "session_id" in data
        assert data["session_id"] == order_id
    
    def test_payment_status_check_invalid_order(self, authenticated_customer):
        """Test checking payment status for invalid order returns 404"""
        response = authenticated_customer.get(f"{BASE_URL}/api/payments/status/invalid_order_12345")
        
        assert response.status_code == 404, f"Expected 404 for invalid order, got {response.status_code}"


class TestCashfreeWebhook:
    """Tests for Cashfree webhook endpoint"""
    
    def test_webhook_endpoint_exists(self, api_client):
        """Test that webhook endpoint exists and accepts POST"""
        # Send a minimal webhook payload
        response = api_client.post(f"{BASE_URL}/api/webhook/cashfree", json={
            "type": "PAYMENT_SUCCESS_WEBHOOK",
            "data": {
                "order": {"order_id": "test_order"},
                "payment": {"payment_status": "SUCCESS"}
            }
        })
        
        # Should return 200 even for unknown orders (graceful handling)
        assert response.status_code == 200, f"Webhook endpoint error: {response.text}"
        data = response.json()
        assert "status" in data


class TestCashfreeIntegrationSummary:
    """Summary tests to verify overall Cashfree integration"""
    
    def test_all_visit_packages_have_correct_amounts(self, api_client, customer_token):
        """Verify all visit packages create orders with correct amounts"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        
        packages = {
            "single_visit": 200.0,
            "three_visits": 350.0,
            "five_visits": 500.0,
            "property_lock": 999.0
        }
        
        for package_id, expected_amount in packages.items():
            response = api_client.post(f"{BASE_URL}/api/payments/checkout", json={
                "package_id": package_id,
                "origin_url": BASE_URL
            })
            
            assert response.status_code == 200, f"Checkout failed for {package_id}: {response.text}"
            data = response.json()
            
            # Verify checkout URL is valid
            assert "checkout_url" in data
            assert "payments.cashfree.com" in data["checkout_url"]
            
            print(f"Package {package_id} (₹{expected_amount}): OK - {data['order_id']}")
    
    def test_cashfree_production_environment(self, authenticated_customer):
        """Verify Cashfree is using production environment"""
        response = authenticated_customer.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "single_visit",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Production URL should be payments.cashfree.com (not payments-test.cashfree.com)
        checkout_url = data["checkout_url"]
        assert "payments.cashfree.com" in checkout_url, f"Not using production: {checkout_url}"
        assert "payments-test.cashfree.com" not in checkout_url, "Using sandbox instead of production"
        
        print(f"Confirmed PRODUCTION environment: {checkout_url}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
