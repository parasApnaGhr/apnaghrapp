#!/usr/bin/env python3
"""
ApnaGhr Field Rider System - Backend API Testing
Tests all authentication, CRUD operations, and role-based access
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class ApnaGhrAPITester:
    def __init__(self, base_url="https://field-rider-ops.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for each role
        self.rider_ids = {}  # Store rider IDs for testing
        self.test_data = {}  # Store created test data IDs
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, token: Optional[str] = None, 
                 params: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name} ({method} {endpoint})...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.failed_tests.append(f"{name}: Connection error - {str(e)}")
            print(f"❌ FAILED - Connection Error: {str(e)}")
            return False, {}
        except Exception as e:
            self.failed_tests.append(f"{name}: Error - {str(e)}")
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_auth_login(self, role: str, phone: str, password: str) -> bool:
        """Test login for a specific role"""
        print(f"\n🔐 Testing Login for {role.upper()}")
        success, response = self.run_test(
            f"Login {role}",
            "POST",
            "auth/login",
            200,
            data={"phone": phone, "password": password}
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            print(f"✅ Login successful for {role}")
            return True
        else:
            print(f"❌ Login failed for {role}")
            return False

    def test_auth_me(self, role: str) -> bool:
        """Test /auth/me endpoint"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get current user ({role})",
            "GET",
            "auth/me",
            200,
            token=self.tokens[role]
        )
        return success

    def test_riders_crud(self) -> bool:
        """Test rider CRUD operations"""
        print(f"\n🏍️  Testing Rider Operations")
        
        if 'admin' not in self.tokens:
            print("❌ Admin token required for rider operations")
            return False

        # Get riders
        success, riders = self.run_test(
            "Get all riders",
            "GET",
            "riders",
            200,
            token=self.tokens['admin']
        )
        
        if success and isinstance(riders, list) and len(riders) > 0:
            # Store first rider for testing
            self.rider_ids['test'] = riders[0]['id']
            print(f"✅ Found {len(riders)} riders")
            
            # Test get specific rider
            success, rider = self.run_test(
                "Get specific rider",
                "GET",
                f"riders/{self.rider_ids['test']}",
                200,
                token=self.tokens['admin']
            )
            
            if success:
                print(f"✅ Retrieved rider details")
                return True
            
        return False

    def test_rider_duty_operations(self) -> bool:
        """Test rider duty toggle and location updates"""
        print(f"\n⏰ Testing Rider Duty Operations")
        
        if 'rider' not in self.tokens or 'test' not in self.rider_ids:
            print("❌ Rider token and ID required")
            return False

        # Test duty toggle ON
        success, response = self.run_test(
            "Start duty",
            "POST",
            f"riders/{self.rider_ids['test']}/duty",
            200,
            data={"on_duty": True, "lat": 30.7333, "lng": 76.7794},
            token=self.tokens['rider']
        )
        
        if not success:
            return False
            
        # Test location update
        success, response = self.run_test(
            "Update location",
            "POST", 
            f"riders/{self.rider_ids['test']}/location",
            200,
            data={"lat": 30.7340, "lng": 76.7800},
            token=self.tokens['rider']
        )
        
        if not success:
            return False
            
        # Test duty toggle OFF
        success, response = self.run_test(
            "End duty",
            "POST",
            f"riders/{self.rider_ids['test']}/duty",
            200,
            data={"on_duty": False},
            token=self.tokens['rider']
        )
        
        return success

    def test_site_visits(self) -> bool:
        """Test site visit operations"""
        print(f"\n🏠 Testing Site Visit Operations")
        
        if 'call_center' not in self.tokens:
            print("❌ Call center token required")
            return False

        # Create site visit
        visit_data = {
            "client_name": "Test Client",
            "property_address": "Test Address, Mohali",
            "property_type": "2BHK",
            "scheduled_time": "10:00",
            "assigned_rider_id": self.rider_ids.get('test'),
            "city": "Mohali"
        }
        
        success, visit = self.run_test(
            "Create site visit",
            "POST",
            "site-visits",
            201,
            data=visit_data,
            token=self.tokens['call_center']
        )
        
        if success and 'id' in visit:
            self.test_data['visit_id'] = visit['id']
            
            # Get site visits
            success, visits = self.run_test(
                "Get site visits",
                "GET",
                "site-visits",
                200,
                token=self.tokens['call_center']
            )
            
            if success:
                # Update site visit
                success, updated = self.run_test(
                    "Update site visit",
                    "PATCH",
                    f"site-visits/{self.test_data['visit_id']}",
                    200,
                    data={"status": "completed", "feedback": "Visit completed successfully"},
                    token=self.tokens['rider']
                )
                return success
                
        return False

    def test_tolet_boards(self) -> bool:
        """Test to-let board operations"""
        print(f"\n📋 Testing To-Let Board Operations")
        
        if 'rider' not in self.tokens:
            print("❌ Rider token required")
            return False

        board_data = {
            "rider_id": self.rider_ids.get('test'),
            "photo_url": "https://example.com/board.jpg",
            "owner_phone": "9876543210",
            "address": "Test Property Address",
            "rent_expected": 25000.0,
            "property_type": "3BHK", 
            "city": "Mohali"
        }
        
        success, board = self.run_test(
            "Create to-let board",
            "POST",
            "tolet-boards",
            201,
            data=board_data,
            token=self.tokens['rider']
        )
        
        if success:
            # Get to-let boards
            success, boards = self.run_test(
                "Get to-let boards",
                "GET",
                "tolet-boards",
                200,
                params={"city": "Mohali"},
                token=self.tokens['rider']
            )
            return success
            
        return False

    def test_broker_visits(self) -> bool:
        """Test broker visit operations"""
        print(f"\n🏢 Testing Broker Visit Operations")
        
        if 'rider' not in self.tokens:
            print("❌ Rider token required")
            return False

        broker_data = {
            "rider_id": self.rider_ids.get('test'),
            "broker_name": "Test Broker",
            "office_location": "Test Office Location",
            "phone_number": "9876543211",
            "interest_level": "high",
            "package_sold": True,
            "city": "Mohali"
        }
        
        success, broker = self.run_test(
            "Create broker visit",
            "POST",
            "broker-visits",
            201,
            data=broker_data,
            token=self.tokens['rider']
        )
        
        if success:
            # Get broker visits
            success, visits = self.run_test(
                "Get broker visits",
                "GET",
                "broker-visits",
                200,
                params={"city": "Mohali"},
                token=self.tokens['rider']
            )
            return success
            
        return False

    def test_dashboards(self) -> bool:
        """Test dashboard endpoints for each role"""
        print(f"\n📊 Testing Dashboard Endpoints")
        
        results = []
        
        # Admin Dashboard
        if 'admin' in self.tokens:
            success, data = self.run_test(
                "Admin Dashboard",
                "GET",
                "dashboard/admin",
                200,
                token=self.tokens['admin']
            )
            results.append(success)
            
        # City Manager Dashboard  
        if 'city_manager' in self.tokens:
            success, data = self.run_test(
                "City Manager Dashboard",
                "GET", 
                "dashboard/city-manager",
                200,
                token=self.tokens['city_manager']
            )
            results.append(success)
            
        return all(results)

    def test_leaderboard(self) -> bool:
        """Test leaderboard endpoint"""
        print(f"\n🏆 Testing Leaderboard")
        
        token = self.tokens.get('admin') or self.tokens.get('rider')
        if not token:
            print("❌ Token required for leaderboard")
            return False
            
        success, leaderboard = self.run_test(
            "Get leaderboard",
            "GET",
            "leaderboard",
            200,
            token=token
        )
        
        return success

    def test_rider_stats(self) -> bool:
        """Test rider statistics"""
        print(f"\n📈 Testing Rider Statistics")
        
        if 'rider' not in self.tokens or 'test' not in self.rider_ids:
            print("❌ Rider token and ID required")
            return False
            
        success, stats = self.run_test(
            "Get rider stats",
            "GET",
            f"riders/{self.rider_ids['test']}/stats",
            200,
            token=self.tokens['rider']
        )
        
        return success

    def test_notifications(self) -> bool:
        """Test notifications"""
        print(f"\n🔔 Testing Notifications")
        
        if 'rider' not in self.tokens:
            print("❌ Rider token required")
            return False
            
        success, notifications = self.run_test(
            "Get notifications",
            "GET",
            "notifications",
            200,
            token=self.tokens['rider']
        )
        
        return success

def main():
    """Main testing function"""
    print("🚀 Starting ApnaGhr Field Rider System API Tests")
    print("=" * 60)
    
    tester = ApnaGhrAPITester()
    
    # Test credentials from requirements
    test_users = {
        'admin': {'phone': '9999999999', 'password': 'admin123'},
        'city_manager': {'phone': '9999999998', 'password': 'manager123'},
        'call_center': {'phone': '9999999996', 'password': 'callcenter123'},
        'rider': {'phone': '9999999991', 'password': 'rider123'}
    }
    
    # Phase 1: Authentication Testing
    print("\n" + "="*60)
    print("PHASE 1: AUTHENTICATION TESTING")
    print("="*60)
    
    auth_success = True
    for role, creds in test_users.items():
        success = tester.test_auth_login(role, creds['phone'], creds['password'])
        if success:
            tester.test_auth_me(role)
        auth_success &= success
    
    if not auth_success:
        print("\n❌ Authentication tests failed. Stopping further tests.")
        print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    # Phase 2: Core Operations Testing
    print("\n" + "="*60) 
    print("PHASE 2: CORE OPERATIONS TESTING")
    print("="*60)
    
    operations_tests = [
        tester.test_riders_crud,
        tester.test_rider_duty_operations,
        tester.test_site_visits,
        tester.test_tolet_boards,
        tester.test_broker_visits,
        tester.test_rider_stats,
        tester.test_notifications
    ]
    
    for test_func in operations_tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Phase 3: Dashboard Testing
    print("\n" + "="*60)
    print("PHASE 3: DASHBOARD & ANALYTICS TESTING") 
    print("="*60)
    
    try:
        tester.test_dashboards()
        tester.test_leaderboard()
    except Exception as e:
        print(f"❌ Dashboard tests failed with exception: {str(e)}")
    
    # Final Results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"✅ Tests Passed: {tester.tests_passed}/{tester.tests_run} ({success_rate:.1f}%)")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for failure in tester.failed_tests[:10]:  # Show first 10 failures
            print(f"   • {failure}")
        if len(tester.failed_tests) > 10:
            print(f"   ... and {len(tester.failed_tests) - 10} more")
    
    print(f"\n🏁 Backend API testing completed")
    
    # Return appropriate exit code
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)