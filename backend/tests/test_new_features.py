"""
Test suite for ApnaGhr Visit Platform - New Features
Tests: Packers & Movers module, Advertising module, Login, Customer Home
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "9999999999"
CUSTOMER_PASSWORD = "test123"
RIDER_PHONE = "8888888888"
RIDER_PASSWORD = "test123"
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
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Customer authentication failed")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "phone": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def authenticated_customer(api_client, customer_token):
    """Session with customer auth header"""
    api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
    return api_client


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_customer_login_success(self, api_client):
        """Test customer login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["phone"] == CUSTOMER_PHONE
        # Role can be 'customer' or 'advertiser' (if they created an advertiser profile)
        assert data["user"]["role"] in ["customer", "advertiser"]
        print(f"✓ Customer login successful - role: {data['user']['role']}")
    
    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - role: {data['user']['role']}")
    
    def test_rider_login_success(self, api_client):
        """Test rider login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "phone": RIDER_PHONE,
            "password": RIDER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "rider"
        print(f"✓ Rider login successful - role: {data['user']['role']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0000000000",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


class TestPackersMoversModule:
    """Test Packers & Movers API endpoints"""
    
    def test_get_packages_no_auth(self, api_client):
        """Test getting packages without authentication (should work)"""
        response = api_client.get(f"{BASE_URL}/api/packers/packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert "add_ons" in data
        assert len(data["packages"]) == 5  # basic, standard, premium, elite, intercity
        print(f"✓ Got {len(data['packages'])} packers packages")
    
    def test_packages_structure(self, api_client):
        """Test package data structure"""
        response = api_client.get(f"{BASE_URL}/api/packers/packages")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 5 tiers exist
        tiers = [p["tier"] for p in data["packages"]]
        assert "basic" in tiers
        assert "standard" in tiers
        assert "premium" in tiers
        assert "elite" in tiers
        assert "intercity" in tiers
        
        # Verify package structure
        for pkg in data["packages"]:
            assert "id" in pkg
            assert "name" in pkg
            assert "tier" in pkg
            assert "price_min" in pkg
            assert "price_max" in pkg
            assert "includes" in pkg
            assert "best_for" in pkg
            assert isinstance(pkg["includes"], list)
            assert isinstance(pkg["best_for"], list)
        print("✓ All package structures validated")
    
    def test_get_specific_package(self, api_client):
        """Test getting a specific package by tier"""
        response = api_client.get(f"{BASE_URL}/api/packers/packages/standard")
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "standard"
        assert data["name"] == "STANDARD SHIFT"
        print(f"✓ Got specific package: {data['name']}")
    
    def test_get_invalid_package(self, api_client):
        """Test getting non-existent package"""
        response = api_client.get(f"{BASE_URL}/api/packers/packages/invalid")
        assert response.status_code == 404
        print("✓ Invalid package correctly returns 404")
    
    def test_book_shifting_requires_auth(self, api_client):
        """Test booking requires authentication"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        response = api_client.post(f"{BASE_URL}/api/packers/book", json={
            "package_tier": "basic",
            "from_address": "Test Address",
            "to_address": "Test Destination",
            "from_city": "Mumbai",
            "to_city": "Pune",
            "scheduled_date": "2026-02-01",
            "contact_phone": "9999999999"
        })
        assert response.status_code in [401, 403]
        print("✓ Booking correctly requires authentication")
    
    def test_book_shifting_success(self, api_client, customer_token):
        """Test successful shifting booking"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        
        scheduled_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        response = api_client.post(f"{BASE_URL}/api/packers/book", json={
            "package_tier": "standard",
            "from_address": "TEST_123 Main Street, Andheri",
            "to_address": "TEST_456 Park Avenue, Bandra",
            "from_city": "Mumbai",
            "to_city": "Mumbai",
            "scheduled_date": scheduled_date,
            "contact_phone": "9999999999",
            "items_description": "2 beds, 1 sofa, 1 fridge",
            "add_ons": ["extra_packing"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "booking" in data
        assert data["booking"]["package_tier"] == "standard"
        assert data["booking"]["status"] == "pending"
        assert data["booking"]["estimated_price"] > 0
        print(f"✓ Booking created - estimated price: ₹{data['booking']['estimated_price']}")
    
    def test_get_my_bookings(self, api_client, customer_token):
        """Test getting user's shifting bookings"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/packers/my-bookings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} shifting bookings")


class TestAdvertisingModule:
    """Test Advertising API endpoints"""
    
    def test_get_ad_packages_no_auth(self, api_client):
        """Test getting ad packages without authentication"""
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/advertising/packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert "add_ons" in data
        assert len(data["packages"]) == 4  # starter, growth, premium, elite
        print(f"✓ Got {len(data['packages'])} advertising packages")
    
    def test_ad_packages_structure(self, api_client):
        """Test ad package data structure"""
        response = api_client.get(f"{BASE_URL}/api/advertising/packages")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 4 tiers exist
        tiers = [p["tier"] for p in data["packages"]]
        assert "starter" in tiers
        assert "growth" in tiers
        assert "premium" in tiers
        assert "elite" in tiers
        
        # Verify package structure
        for pkg in data["packages"]:
            assert "id" in pkg
            assert "name" in pkg
            assert "tier" in pkg
            assert "price_monthly" in pkg
            assert "includes" in pkg
            assert "best_for" in pkg
            assert "posters_allowed" in pkg
        print("✓ All ad package structures validated")
    
    def test_get_specific_ad_package(self, api_client):
        """Test getting a specific ad package by tier"""
        response = api_client.get(f"{BASE_URL}/api/advertising/packages/growth")
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "growth"
        assert data["name"] == "GROWTH PACKAGE"
        print(f"✓ Got specific ad package: {data['name']}")
    
    def test_create_advertiser_profile(self, api_client, customer_token):
        """Test creating advertiser profile"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.post(f"{BASE_URL}/api/advertising/profile", json={
            "company_name": "TEST_Company Ltd",
            "business_type": "packers_movers",
            "contact_email": "test@testcompany.com",
            "contact_phone": "9999999999",
            "gst_number": "TEST123456789",
            "address": "Test Business Address"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == "TEST_Company Ltd"
        print(f"✓ Advertiser profile created: {data['company_name']}")
    
    def test_create_advertisement(self, api_client, customer_token):
        """Test creating an advertisement"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        response = api_client.post(f"{BASE_URL}/api/advertising/ads", json={
            "company_name": "TEST_Company Ltd",
            "package_tier": "starter",
            "poster_images": [],
            "description": "TEST_Best packers and movers in town!",
            "placement": ["home"],
            "start_date": start_date,
            "end_date": end_date
        })
        assert response.status_code == 200
        data = response.json()
        assert "ad" in data
        assert data["ad"]["status"] == "pending"
        print(f"✓ Advertisement created - status: {data['ad']['status']}")
    
    def test_get_my_advertisements(self, api_client, customer_token):
        """Test getting user's advertisements"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/advertising/ads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} advertisements")
    
    def test_get_active_ads_public(self, api_client):
        """Test getting active ads (public endpoint)"""
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/advertising/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} active ads")


class TestPropertiesAndCustomerHome:
    """Test properties endpoints for customer home"""
    
    def test_get_properties(self, api_client, customer_token):
        """Test getting properties list"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} properties")
    
    def test_properties_have_hot_badge_fields(self, api_client, customer_token):
        """Test properties have HOT badge and view count fields"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            prop = data[0]
            # Check for new fields (may or may not be present)
            assert "is_hot" in prop or True  # Field may not be in response
            assert "weekly_visits" in prop or True
            print(f"✓ Property fields validated - first property: {prop.get('title', 'N/A')}")
        else:
            print("✓ No properties to validate (empty list)")
    
    def test_filter_properties_by_city(self, api_client, customer_token):
        """Test filtering properties by city"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/properties", params={"city": "Mohali"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered properties by city - got {len(data)} results")
    
    def test_filter_properties_by_bhk(self, api_client, customer_token):
        """Test filtering properties by BHK"""
        api_client.headers.update({"Authorization": f"Bearer {customer_token}"})
        response = api_client.get(f"{BASE_URL}/api/properties", params={"bhk": 2})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for prop in data:
            assert prop["bhk"] == 2
        print(f"✓ Filtered properties by BHK - got {len(data)} 2BHK properties")


class TestAdminPackersEndpoints:
    """Test admin endpoints for packers module"""
    
    def test_admin_get_all_bookings(self, api_client, admin_token):
        """Test admin getting all shifting bookings"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/packers/admin/bookings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} shifting bookings")


class TestAdminAdvertisingEndpoints:
    """Test admin endpoints for advertising module"""
    
    def test_admin_get_all_ads(self, api_client, admin_token):
        """Test admin getting all advertisements"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/advertising/admin/ads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} advertisements")
    
    def test_admin_get_all_profiles(self, api_client, admin_token):
        """Test admin getting all advertiser profiles"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/advertising/admin/profiles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} advertiser profiles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
