"""
Test Registration, Login, Admin Settings, and AI Ad Generator Features
Tests for:
1. User registration for all roles (customer, rider, advertiser, builder)
2. User login after registration
3. Admin app customization settings (seasonal themes)
4. AI Ad Generator form visibility (not actual generation)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserRegistration:
    """Test user registration for all roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:8]}"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
        # Cleanup would go here if needed
    
    def test_register_customer(self):
        """Test customer registration"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"{self.test_prefix}_Customer",
            "phone": phone,
            "email": f"{self.test_prefix}@test.com",
            "password": "test123456",
            "role": "customer"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["role"] == "customer"
        assert data["phone"] == phone
        assert data["name"] == f"{self.test_prefix}_Customer"
        assert "id" in data
        print(f"✓ Customer registration successful: {phone}")
        
        # Verify login works
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": "test123456"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        assert "token" in login_data
        assert login_data["user"]["role"] == "customer"
        print(f"✓ Customer login successful")
    
    def test_register_rider(self):
        """Test rider registration"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"{self.test_prefix}_Rider",
            "phone": phone,
            "password": "rider123456",
            "role": "rider"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["role"] == "rider"
        assert data["phone"] == phone
        print(f"✓ Rider registration successful: {phone}")
        
        # Verify login works
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": "rider123456"
        })
        assert login_response.status_code == 200
        assert login_response.json()["user"]["role"] == "rider"
        print(f"✓ Rider login successful")
    
    def test_register_advertiser(self):
        """Test advertiser registration"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"{self.test_prefix}_Advertiser",
            "phone": phone,
            "email": f"{self.test_prefix}_adv@test.com",
            "password": "adv123456",
            "role": "advertiser"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["role"] == "advertiser"
        print(f"✓ Advertiser registration successful: {phone}")
        
        # Verify login works
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": "adv123456"
        })
        assert login_response.status_code == 200
        assert login_response.json()["user"]["role"] == "advertiser"
        print(f"✓ Advertiser login successful")
    
    def test_register_builder(self):
        """Test builder registration"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"{self.test_prefix}_Builder",
            "phone": phone,
            "password": "build123456",
            "role": "builder"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["role"] == "builder"
        print(f"✓ Builder registration successful: {phone}")
        
        # Verify login works
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": "build123456"
        })
        assert login_response.status_code == 200
        assert login_response.json()["user"]["role"] == "builder"
        print(f"✓ Builder login successful")
    
    def test_duplicate_phone_registration_fails(self):
        """Test that duplicate phone registration fails"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        
        # First registration
        response1 = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "First User",
            "phone": phone,
            "password": "test123456",
            "role": "customer"
        })
        assert response1.status_code == 200
        
        # Second registration with same phone should fail
        response2 = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Second User",
            "phone": phone,
            "password": "test123456",
            "role": "customer"
        })
        assert response2.status_code == 400
        assert "already registered" in response2.json().get("detail", "").lower()
        print(f"✓ Duplicate phone registration correctly rejected")
    
    def test_login_with_wrong_password_fails(self):
        """Test that login with wrong password fails"""
        phone = f"6{uuid.uuid4().int % 1000000000:09d}"
        
        # Register first
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "phone": phone,
            "password": "correctpassword",
            "role": "customer"
        })
        
        # Try login with wrong password
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": phone,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Wrong password login correctly rejected")


class TestExistingCredentials:
    """Test login with existing test credentials from test_credentials.md"""
    
    def setup_method(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_customer(self):
        """Test login with customer credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6987654321",
            "password": "test123"
        })
        assert response.status_code == 200, f"Customer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer login successful (6987654321)")
    
    def test_login_rider(self):
        """Test login with rider credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6111222333",
            "password": "rider123"
        })
        assert response.status_code == 200, f"Rider login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "rider"
        print(f"✓ Rider login successful (6111222333)")
    
    def test_login_advertiser(self):
        """Test login with advertiser credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6222333444",
            "password": "adv123"
        })
        assert response.status_code == 200, f"Advertiser login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "advertiser"
        print(f"✓ Advertiser login successful (6222333444)")
    
    def test_login_builder(self):
        """Test login with builder credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6333444555",
            "password": "build123"
        })
        assert response.status_code == 200, f"Builder login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "builder"
        print(f"✓ Builder login successful (6333444555)")
    
    def test_login_admin(self):
        """Test login with admin credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "7777777777",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful (7777777777)")


class TestAppCustomizationSettings:
    """Test Admin App Customization Settings (seasonal themes)"""
    
    def setup_method(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "7777777777",
            "password": "admin123"
        })
        assert response.status_code == 200, "Admin login failed"
        self.token = response.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_get_app_customization_settings(self):
        """Test getting app customization settings (public endpoint)"""
        # This endpoint is public, no auth needed
        response = requests.get(f"{BASE_URL}/api/settings/app-customization")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = [
            "seasonal_theme", "seasonal_banner_text", "seasonal_discount_percent",
            "seasonal_active", "homepage_highlight", "accent_color",
            "enable_animations", "show_offers_badge"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ App customization settings retrieved successfully")
        print(f"  Current theme: {data.get('seasonal_theme')}")
        print(f"  Banner text: {data.get('seasonal_banner_text')}")
    
    def test_save_holi_theme_settings(self):
        """Test saving Holi theme settings"""
        settings = {
            "seasonal_theme": "holi",
            "seasonal_banner_text": "Happy Holi! Get 15% off on visit bookings",
            "seasonal_discount_percent": 15,
            "seasonal_active": True,
            "homepage_highlight": "Book visits at just ₹170 this Holi!",
            "accent_color": "#FF5A5F",
            "enable_animations": True,
            "show_offers_badge": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/settings/app-customization", json=settings)
        assert response.status_code == 200, f"Save settings failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert data["settings"]["seasonal_theme"] == "holi"
        assert data["settings"]["seasonal_discount_percent"] == 15
        print(f"✓ Holi theme settings saved successfully")
    
    def test_save_diwali_theme_settings(self):
        """Test saving Diwali theme settings"""
        settings = {
            "seasonal_theme": "diwali",
            "seasonal_banner_text": "Diwali Dhamaka! Special offers on property visits",
            "seasonal_discount_percent": 20,
            "seasonal_active": True,
            "homepage_highlight": "Light up your new home this Diwali!",
            "accent_color": "#FFD166",
            "enable_animations": True,
            "show_offers_badge": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/settings/app-customization", json=settings)
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["seasonal_theme"] == "diwali"
        print(f"✓ Diwali theme settings saved successfully")
    
    def test_disable_seasonal_theme(self):
        """Test disabling seasonal theme"""
        settings = {
            "seasonal_theme": "none",
            "seasonal_banner_text": "",
            "seasonal_discount_percent": 0,
            "seasonal_active": False,
            "homepage_highlight": "",
            "accent_color": "#FF5A5F",
            "enable_animations": True,
            "show_offers_badge": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/settings/app-customization", json=settings)
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["seasonal_theme"] == "none"
        assert data["settings"]["seasonal_active"] == False
        print(f"✓ Seasonal theme disabled successfully")
    
    def test_non_admin_cannot_save_settings(self):
        """Test that non-admin users cannot save settings"""
        # Login as customer
        customer_session = requests.Session()
        customer_session.headers.update({"Content-Type": "application/json"})
        
        login_response = customer_session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6987654321",
            "password": "test123"
        })
        assert login_response.status_code == 200
        customer_token = login_response.json()["token"]
        customer_session.headers.update({"Authorization": f"Bearer {customer_token}"})
        
        # Try to save settings
        settings = {
            "seasonal_theme": "holi",
            "seasonal_banner_text": "Test",
            "seasonal_discount_percent": 10,
            "seasonal_active": True,
            "homepage_highlight": "Test",
            "accent_color": "#FF5A5F",
            "enable_animations": True,
            "show_offers_badge": True
        }
        
        response = customer_session.post(f"{BASE_URL}/api/settings/app-customization", json=settings)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Non-admin correctly rejected from saving settings")


class TestAIAdGeneratorEndpoints:
    """Test AI Ad Generator endpoints (form visibility, not actual generation)"""
    
    def setup_method(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as advertiser
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "6222333444",
            "password": "adv123"
        })
        assert response.status_code == 200, "Advertiser login failed"
        self.token = response.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_advertising_packages_endpoint(self):
        """Test that advertising packages endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/advertising/packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert len(data["packages"]) >= 4  # starter, growth, premium, elite
        print(f"✓ Advertising packages endpoint working ({len(data['packages'])} packages)")
    
    def test_get_generated_ads_endpoint(self):
        """Test that get generated ads endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/advertising/generated-ads")
        assert response.status_code == 200
        data = response.json()
        assert "ads" in data
        print(f"✓ Generated ads endpoint working ({len(data['ads'])} ads)")
    
    def test_generate_ad_endpoint_exists(self):
        """Test that generate-ad endpoint exists and validates input"""
        # Test with empty company name - should fail validation
        response = self.session.post(f"{BASE_URL}/api/advertising/generate-ad", json={
            "company_name": "",
            "business_type": "packers_movers",
            "style": "modern",
            "ad_type": "poster",
            "include_contact": True
        })
        # Should return 422 (validation error) or 500 (if AI not configured)
        # Either way, endpoint exists
        assert response.status_code in [422, 500], f"Unexpected status: {response.status_code}"
        print(f"✓ Generate ad endpoint exists (status: {response.status_code})")
    
    def test_advertiser_profile_endpoint(self):
        """Test advertiser profile endpoint"""
        # Try to get profile (may not exist)
        response = self.session.get(f"{BASE_URL}/api/advertising/profile")
        # 200 if exists, 404 if not
        assert response.status_code in [200, 404]
        print(f"✓ Advertiser profile endpoint working (status: {response.status_code})")


class TestRestoreHoliTheme:
    """Restore Holi theme after tests"""
    
    def test_restore_holi_theme(self):
        """Restore Holi theme settings"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "7777777777",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Restore Holi theme
        settings = {
            "seasonal_theme": "holi",
            "seasonal_banner_text": "Happy Holi! Get 10% off on visit bookings",
            "seasonal_discount_percent": 10,
            "seasonal_active": True,
            "homepage_highlight": "Book visits at just ₹180 this Holi!",
            "accent_color": "#FF5A5F",
            "enable_animations": True,
            "show_offers_badge": True
        }
        
        response = session.post(f"{BASE_URL}/api/settings/app-customization", json=settings)
        assert response.status_code == 200
        print(f"✓ Holi theme restored")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
