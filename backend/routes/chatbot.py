"""
AI Chatbot for Property Assistance with Taste Matching
Uses Emergent LLM Key for conversational AI
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import os
import uuid
import json
import re
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

# Import the LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# System prompt for property assistant with taste matching
SYSTEM_PROMPT = """You are ApnaGhr's AI Property Assistant.

RULES:
1. When user mentions ANY property requirement (budget, BHK type, location, amenities), you MUST include a search command
2. Be friendly and conversational (Hinglish is fine)
3. Keep responses to 2-3 sentences max

MANDATORY SEARCH FORMAT:
Whenever the user mentions requirements, include this in your response:
[SEARCH_PROPERTIES]{"max_budget": 20000, "bhk_type": "2BHK"}[/SEARCH_PROPERTIES]

Parameters (include what user mentioned):
- min_budget: number
- max_budget: number  
- location: string
- bhk_type: "1BHK", "2BHK", "3BHK", "4BHK"
- amenities: ["parking", "ac", "furnished", "gym", etc]

EXAMPLES:
User: "2BHK under 15000"
You: "Let me find 2BHK options under ₹15,000 for you! [SEARCH_PROPERTIES]{"max_budget": 15000, "bhk_type": "2BHK"}[/SEARCH_PROPERTIES] Any preferred location?"

User: "in Koramangala with parking"
You: "Searching Koramangala properties with parking! [SEARCH_PROPERTIES]{"location": "koramangala", "amenities": ["parking"]}[/SEARCH_PROPERTIES]"

ALWAYS include [SEARCH_PROPERTIES] when user gives preferences. Never skip it!"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    properties: Optional[List[Dict]] = None  # Attached property recommendations


class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    messages: List[ChatMessage] = []
    preferences: Dict[str, Any] = {}  # Extracted user preferences
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SendMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class SendMessageResponse(BaseModel):
    session_id: str
    response: str
    properties: Optional[List[Dict]] = None


def extract_search_params(response_text: str) -> Optional[Dict]:
    """Extract property search parameters from AI response"""
    pattern = r'\[SEARCH_PROPERTIES\](.*?)\[/SEARCH_PROPERTIES\]'
    match = re.search(pattern, response_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None


def clean_response(response_text: str) -> str:
    """Remove search tags from response for display"""
    pattern = r'\[SEARCH_PROPERTIES\].*?\[/SEARCH_PROPERTIES\]'
    return re.sub(pattern, '', response_text, flags=re.DOTALL).strip()


async def search_properties(db, params: Dict) -> List[Dict]:
    """Search properties based on extracted preferences"""
    query = {"is_available": True}
    
    # Budget filter
    if params.get("min_budget") or params.get("max_budget"):
        rent_query = {}
        if params.get("min_budget"):
            rent_query["$gte"] = params["min_budget"]
        if params.get("max_budget"):
            rent_query["$lte"] = params["max_budget"]
        if rent_query:
            query["rent"] = rent_query
    
    # BHK type filter (search in title)
    if params.get("bhk_type"):
        bhk = params["bhk_type"].upper().replace(" ", "")
        query["title"] = {"$regex": bhk, "$options": "i"}
    
    # Location filter (search in location or address)
    if params.get("location"):
        location = params["location"]
        query["$or"] = [
            {"location": {"$regex": location, "$options": "i"}},
            {"address": {"$regex": location, "$options": "i"}}
        ]
    
    # Fetch matching properties
    cursor = db.properties.find(query, {"_id": 0}).limit(5)
    properties = await cursor.to_list(length=5)
    
    # If amenities filter specified, score and sort by match
    if params.get("amenities") and properties:
        requested_amenities = set(a.lower() for a in params["amenities"])
        for prop in properties:
            prop_amenities = set(a.lower() for a in prop.get("amenities", []))
            prop["match_score"] = len(requested_amenities & prop_amenities)
        properties.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    return properties


def format_property_for_chat(prop: Dict) -> str:
    """Format a property for chat display"""
    title = prop.get("title", "Property")
    rent = prop.get("rent", 0)
    location = prop.get("location", "")
    amenities = prop.get("amenities", [])
    
    amenities_str = ", ".join(amenities[:4]) if amenities else "Contact for details"
    
    return f"🏠 **{title}** - ₹{rent:,}/month\n📍 {location}\n✨ {amenities_str}"


async def get_or_create_session(db, user_id: str, session_id: Optional[str] = None) -> Dict:
    """Get existing session or create new one"""
    if session_id:
        session = await db.chat_sessions.find_one(
            {"id": session_id, "user_id": user_id},
            {"_id": 0}
        )
        if session:
            return session
    
    # Create new session
    new_session = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "messages": [],
        "preferences": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.chat_sessions.insert_one(new_session)
    return new_session


def get_db():
    """Get database instance - imported from main server"""
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


def setup_chatbot_routes(main_router, db_instance, get_current_user_func):
    """Setup chatbot routes with dependency injection"""
    
    @main_router.post("/chatbot/send", response_model=SendMessageResponse)
    async def send_message(
        request: SendMessageRequest,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Send a message to the AI chatbot and get property recommendations"""
        user_id = current_user["id"]
        
        # Get or create session
        session = await get_or_create_session(db_instance, user_id, request.session_id)
        session_id = session["id"]
        
        # Build conversation history for LLM
        history_messages = []
        for msg in session.get("messages", [])[-10:]:  # Last 10 messages for context
            history_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Initialize LLM chat
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"apnaghr-{session_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o-mini")
        
        # Add history to chat
        for msg in history_messages:
            if msg["role"] == "user":
                await chat.send_message(UserMessage(text=msg["content"]))
        
        # Send current message
        user_message = UserMessage(text=request.message)
        ai_response = await chat.send_message(user_message)
        
        # Check if AI wants to search properties
        search_params = extract_search_params(ai_response)
        properties = None
        
        if search_params:
            # Search for matching properties
            properties = await search_properties(db_instance, search_params)
            
            # If we found properties, add them to context and get refined response
            if properties:
                property_context = "\n\n".join([
                    format_property_for_chat(p) for p in properties[:3]
                ])
                
                # Ask AI to present the properties
                follow_up = UserMessage(
                    text=f"[SYSTEM: Found {len(properties)} matching properties. Present these to the user naturally:\n{property_context}]"
                )
                ai_response = await chat.send_message(follow_up)
        
        # Clean response for display
        clean_ai_response = clean_response(ai_response)
        
        # Save messages to session
        user_msg = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now(timezone.utc)
        }
        assistant_msg = {
            "role": "assistant", 
            "content": clean_ai_response,
            "timestamp": datetime.now(timezone.utc),
            "properties": properties
        }
        
        await db_instance.chat_sessions.update_one(
            {"id": session_id},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        # Prepare property response (simplified for frontend)
        property_list = None
        if properties:
            property_list = [
                {
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "rent": p.get("rent"),
                    "location": p.get("location"),
                    "images": p.get("images", [])[:1],  # First image only
                    "amenities": p.get("amenities", [])[:4]
                }
                for p in properties[:3]
            ]
        
        return SendMessageResponse(
            session_id=session_id,
            response=clean_ai_response,
            properties=property_list
        )
    
    @main_router.get("/chatbot/history/{session_id}")
    async def get_chat_history(
        session_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get chat history for a session"""
        session = await db_instance.chat_sessions.find_one(
            {"id": session_id, "user_id": current_user["id"]},
            {"_id": 0}
        )
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session["id"],
            "messages": session.get("messages", []),
            "created_at": session.get("created_at")
        }
    
    @main_router.get("/chatbot/sessions")
    async def get_user_sessions(
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get all chat sessions for current user"""
        cursor = db_instance.chat_sessions.find(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(10)
        
        sessions = await cursor.to_list(length=10)
        return {"sessions": sessions}
    
    @main_router.delete("/chatbot/session/{session_id}")
    async def delete_session(
        session_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Delete a chat session"""
        result = await db_instance.chat_sessions.delete_one(
            {"id": session_id, "user_id": current_user["id"]}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted"}
    
    @main_router.post("/chatbot/new-session")
    async def create_new_session(
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create a new chat session"""
        session = await get_or_create_session(db_instance, current_user["id"])
        return {
            "session_id": session["id"],
            "message": "New session created! How can I help you find your perfect home today?"
        }
    
    return main_router
