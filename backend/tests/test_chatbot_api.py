"""
Test AI Chatbot API endpoints
Tests: new session creation, message sending, property recommendations
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "6987654321"
CUSTOMER_PASSWORD = "newpass123"


class TestChatbotAPI:
    """AI Chatbot endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as customer
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Authentication failed: {login_response.text}")
        
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.chat_session_id = None
    
    def test_create_new_session(self):
        """Test creating a new chat session"""
        response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "message" in data, "Response should contain welcome message"
        assert len(data["session_id"]) > 0, "Session ID should not be empty"
        
        self.chat_session_id = data["session_id"]
        print(f"✓ New session created: {self.chat_session_id}")
    
    def test_send_message_basic(self):
        """Test sending a basic message to chatbot"""
        # First create a session
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Send a message
        response = self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "Hello, I'm looking for a home"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "response" in data, "Response should contain AI response"
        assert len(data["response"]) > 0, "AI response should not be empty"
        
        print(f"✓ AI Response: {data['response'][:100]}...")
    
    def test_send_message_with_preferences(self):
        """Test sending a message with property preferences - should return property recommendations"""
        # Create a session
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Send a message with property preferences
        response = self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "I need a 2BHK under 15000 rupees"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Response should contain AI response"
        
        # Check if properties are returned (may or may not have matching properties)
        if data.get("properties"):
            print(f"✓ Found {len(data['properties'])} matching properties")
            for prop in data["properties"]:
                assert "id" in prop, "Property should have id"
                assert "title" in prop, "Property should have title"
                assert "rent" in prop, "Property should have rent"
                print(f"  - {prop['title']}: ₹{prop['rent']}")
        else:
            print("✓ No matching properties found (expected if no 2BHK under 15000 in DB)")
        
        print(f"✓ AI Response: {data['response'][:100]}...")
    
    def test_send_message_location_preference(self):
        """Test sending a message with location preference"""
        # Create a session
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Send a message with location preference
        response = self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "Show me properties in Koramangala"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Response should contain AI response"
        
        if data.get("properties"):
            print(f"✓ Found {len(data['properties'])} properties in Koramangala")
            for prop in data["properties"]:
                print(f"  - {prop['title']}: {prop.get('location', 'N/A')}")
        else:
            print("✓ No properties found in Koramangala (may not be in DB)")
    
    def test_get_chat_history(self):
        """Test getting chat history for a session"""
        # Create a session and send a message
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Send a message
        self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "Hello"
        })
        
        # Get history
        response = self.session.get(f"{BASE_URL}/api/chatbot/history/{session_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "messages" in data, "Response should contain messages"
        assert len(data["messages"]) >= 2, "Should have at least user message and AI response"
        
        print(f"✓ Chat history has {len(data['messages'])} messages")
    
    def test_get_user_sessions(self):
        """Test getting all chat sessions for current user"""
        # Create a session first
        self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        
        # Get all sessions
        response = self.session.get(f"{BASE_URL}/api/chatbot/sessions")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sessions" in data, "Response should contain sessions list"
        assert len(data["sessions"]) >= 1, "Should have at least one session"
        
        print(f"✓ User has {len(data['sessions'])} chat sessions")
    
    def test_delete_session(self):
        """Test deleting a chat session"""
        # Create a session
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Delete the session
        response = self.session.delete(f"{BASE_URL}/api/chatbot/session/{session_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain success message"
        
        # Verify session is deleted
        history_response = self.session.get(f"{BASE_URL}/api/chatbot/history/{session_id}")
        assert history_response.status_code == 404, "Deleted session should return 404"
        
        print(f"✓ Session {session_id} deleted successfully")
    
    def test_unauthorized_access(self):
        """Test that chatbot requires authentication"""
        # Create a new session without auth
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.post(f"{BASE_URL}/api/chatbot/new-session")
        
        assert response.status_code in [401, 403], f"Expected 401/403 for unauthorized access, got {response.status_code}"
        print("✓ Unauthorized access correctly rejected")


class TestChatbotPropertySearch:
    """Test property search functionality in chatbot"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as customer
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "phone": CUSTOMER_PHONE,
            "password": CUSTOMER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Authentication failed: {login_response.text}")
        
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_property_search_with_budget(self):
        """Test property search with budget constraint"""
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        session_id = session_response.json()["session_id"]
        
        response = self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "Find me properties under 20000 rupees"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify properties returned are within budget
        if data.get("properties"):
            for prop in data["properties"]:
                assert prop["rent"] <= 20000, f"Property rent {prop['rent']} exceeds budget 20000"
            print(f"✓ All {len(data['properties'])} properties are within budget")
        else:
            print("✓ No properties found within budget (expected if none in DB)")
    
    def test_property_search_with_bhk(self):
        """Test property search with BHK type"""
        session_response = self.session.post(f"{BASE_URL}/api/chatbot/new-session")
        session_id = session_response.json()["session_id"]
        
        response = self.session.post(f"{BASE_URL}/api/chatbot/send", json={
            "session_id": session_id,
            "message": "I want a 3BHK apartment"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("properties"):
            for prop in data["properties"]:
                assert "3BHK" in prop["title"].upper() or "3 BHK" in prop["title"].upper(), \
                    f"Property {prop['title']} is not a 3BHK"
            print(f"✓ All {len(data['properties'])} properties are 3BHK")
        else:
            print("✓ No 3BHK properties found (expected if none in DB)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
