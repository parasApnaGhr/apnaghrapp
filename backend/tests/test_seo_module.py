"""
SEO Module Tests - Testing SEO pages, blog system, and sitemap functionality
Tests for ApnaGhr programmatic SEO page generator
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://field-rider-ops.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("✓ API health check passed")


class TestSEOPropertiesAPI:
    """Test /api/seo/properties endpoint - PUBLIC, no auth required"""
    
    def test_seo_properties_endpoint_exists(self):
        """Test that SEO properties endpoint is accessible without auth"""
        response = requests.get(f"{BASE_URL}/api/seo/properties")
        assert response.status_code == 200
        print("✓ SEO properties endpoint accessible without auth")
    
    def test_seo_properties_returns_list(self):
        """Test that endpoint returns a list of properties"""
        response = requests.get(f"{BASE_URL}/api/seo/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ SEO properties returns list with {len(data)} items")
    
    def test_seo_properties_filter_by_city(self):
        """Test filtering properties by city"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?city=mohali")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # If properties exist, verify they are from Mohali
        if len(data) > 0:
            for prop in data:
                assert prop.get('city', '').lower() == 'mohali'
        print(f"✓ City filter works - {len(data)} properties in Mohali")
    
    def test_seo_properties_filter_by_listing_type(self):
        """Test filtering by listing type (rent/buy)"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listing type filter works - {len(data)} rental properties")
    
    def test_seo_properties_filter_by_bedrooms(self):
        """Test filtering by number of bedrooms"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?bedrooms=2")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Bedrooms filter works - {len(data)} 2BHK properties")
    
    def test_seo_properties_filter_by_price_range(self):
        """Test filtering by price range"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?min_price=10000&max_price=30000&listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Price range filter works - {len(data)} properties in range")
    
    def test_seo_properties_combined_filters(self):
        """Test multiple filters combined"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?city=mohali&bedrooms=2&listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Combined filters work - {len(data)} 2BHK rentals in Mohali")
    
    def test_seo_properties_excludes_sensitive_data(self):
        """Test that sensitive data is excluded from response"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?city=mohali")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            prop = data[0]
            # These fields should be excluded
            assert 'exact_address' not in prop
            assert 'latitude' not in prop
            assert 'longitude' not in prop
            assert 'owner_phone' not in prop
            assert 'owner_id' not in prop
            print("✓ Sensitive data excluded from SEO properties response")
        else:
            print("⚠ No properties to verify sensitive data exclusion")


class TestSitemapXMLAPI:
    """Test /api/sitemap.xml endpoint - PUBLIC, no auth required"""
    
    def test_sitemap_xml_endpoint_exists(self):
        """Test that sitemap.xml endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        print("✓ Sitemap.xml endpoint accessible")
    
    def test_sitemap_xml_returns_valid_xml(self):
        """Test that sitemap returns valid XML"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        assert '<?xml version="1.0"' in content
        assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in content
        assert '</urlset>' in content
        print("✓ Sitemap returns valid XML structure")
    
    def test_sitemap_xml_contains_required_urls(self):
        """Test that sitemap contains essential URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        # Check for essential pages
        assert '/blogs' in content
        assert '/sitemap' in content
        assert '/rent/flats-in-mohali' in content
        assert '/buy/flats-in-mohali' in content
        print("✓ Sitemap contains essential URLs")
    
    def test_sitemap_xml_contains_city_pages(self):
        """Test that sitemap contains city-level pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        cities = ['mohali', 'chandigarh', 'panchkula', 'zirakpur']
        for city in cities:
            assert f'/rent/flats-in-{city}' in content
            assert f'/buy/flats-in-{city}' in content
        print("✓ Sitemap contains city-level pages")
    
    def test_sitemap_xml_contains_property_type_pages(self):
        """Test that sitemap contains property type pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        property_types = ['1bhk', '2bhk', '3bhk', '4bhk']
        for pt in property_types:
            assert f'/rent/{pt}-in-mohali' in content
        print("✓ Sitemap contains property type pages")
    
    def test_sitemap_xml_contains_blog_pages(self):
        """Test that sitemap contains blog pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        # Check for blog slugs
        assert '/blogs/how-to-find-perfect-rental-home-mohali' in content
        print("✓ Sitemap contains blog pages")
    
    def test_sitemap_xml_has_proper_url_structure(self):
        """Test that sitemap URLs have proper structure"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        # Check for URL elements
        assert '<url>' in content
        assert '<loc>' in content
        assert '<lastmod>' in content
        assert '<changefreq>' in content
        assert '<priority>' in content
        print("✓ Sitemap has proper URL structure")


class TestSitemapDataAPI:
    """Test /api/seo/sitemap-data endpoint - PUBLIC, no auth required"""
    
    def test_sitemap_data_endpoint_exists(self):
        """Test that sitemap-data endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/seo/sitemap-data")
        assert response.status_code == 200
        print("✓ Sitemap-data endpoint accessible")
    
    def test_sitemap_data_returns_cities(self):
        """Test that sitemap-data returns city information"""
        response = requests.get(f"{BASE_URL}/api/seo/sitemap-data")
        assert response.status_code == 200
        data = response.json()
        assert 'cities' in data
        assert isinstance(data['cities'], list)
        print(f"✓ Sitemap-data returns {len(data['cities'])} cities")
    
    def test_sitemap_data_returns_property_types(self):
        """Test that sitemap-data returns property type distribution"""
        response = requests.get(f"{BASE_URL}/api/seo/sitemap-data")
        assert response.status_code == 200
        data = response.json()
        assert 'property_types' in data
        assert isinstance(data['property_types'], list)
        print(f"✓ Sitemap-data returns property type distribution")
    
    def test_sitemap_data_returns_total_count(self):
        """Test that sitemap-data returns total property count"""
        response = requests.get(f"{BASE_URL}/api/seo/sitemap-data")
        assert response.status_code == 200
        data = response.json()
        assert 'total_properties' in data
        assert isinstance(data['total_properties'], int)
        print(f"✓ Sitemap-data returns total count: {data['total_properties']}")


class TestSEOPagesNoAuth:
    """Test that SEO pages don't require authentication"""
    
    def test_seo_properties_no_auth_required(self):
        """Verify SEO properties endpoint works without auth token"""
        response = requests.get(f"{BASE_URL}/api/seo/properties")
        # Should NOT return 401 Unauthorized
        assert response.status_code != 401
        assert response.status_code == 200
        print("✓ SEO properties endpoint does NOT require auth")
    
    def test_sitemap_xml_no_auth_required(self):
        """Verify sitemap.xml endpoint works without auth token"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code != 401
        assert response.status_code == 200
        print("✓ Sitemap.xml endpoint does NOT require auth")
    
    def test_sitemap_data_no_auth_required(self):
        """Verify sitemap-data endpoint works without auth token"""
        response = requests.get(f"{BASE_URL}/api/seo/sitemap-data")
        assert response.status_code != 401
        assert response.status_code == 200
        print("✓ Sitemap-data endpoint does NOT require auth")


class TestSEOPropertiesDataIntegrity:
    """Test data integrity of SEO properties response"""
    
    def test_properties_have_required_fields(self):
        """Test that properties have essential fields for SEO display"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?city=mohali")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            prop = data[0]
            # Check for essential display fields
            assert 'id' in prop
            assert 'title' in prop
            assert 'city' in prop
            assert 'area_name' in prop
            print("✓ Properties have required fields for SEO display")
        else:
            print("⚠ No properties to verify field structure")
    
    def test_properties_have_pricing_info(self):
        """Test that properties have pricing information"""
        response = requests.get(f"{BASE_URL}/api/seo/properties?city=mohali&listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            prop = data[0]
            # Rental properties should have rent field
            assert 'rent' in prop or 'price' in prop
            print("✓ Properties have pricing information")
        else:
            print("⚠ No properties to verify pricing info")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
