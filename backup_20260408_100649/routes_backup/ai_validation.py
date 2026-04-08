"""
AI Property Validation Routes
Uses Emergent LLM to analyze and validate property listings
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import os
import re

router = APIRouter(tags=["ai-validation"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# JWT auth
JWT_SECRET = os.environ.get('JWT_SECRET', 'apnaghr-visit-platform-2024')
JWT_ALGORITHM = 'HS256'

import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Models
class PropertyValidationRequest(BaseModel):
    title: str
    description: str
    property_type: Optional[str] = None
    amenities: List[str] = []
    bhk: Optional[int] = None
    rent: Optional[float] = None
    city: Optional[str] = None
    area_name: Optional[str] = None


class PropertyValidationResponse(BaseModel):
    detected_type: str
    type_confidence: float
    description_quality: str
    missing_amenities: List[str]
    suggestions: List[str]
    issues: List[str]
    enhanced_description: Optional[str] = None


# Property type keywords mapping
PROPERTY_TYPE_KEYWORDS = {
    'apartment': ['flat', 'apartment', 'floor', 'tower', 'complex', 'society', 'building'],
    'house': ['house', 'kothi', 'independent', 'bungalow', 'home', 'residence', 'duplex'],
    'villa': ['villa', 'farmhouse', 'mansion', 'estate', 'luxury home'],
    'studio': ['studio', 'bachelor', 'single room', '1rk'],
    'pg': ['pg', 'paying guest', 'hostel', 'shared', 'dormitory', 'boys', 'girls']
}

# Required amenities by property type
REQUIRED_AMENITIES = {
    'apartment': ['Parking', 'Lift', 'Security', 'Power Backup', 'Water Supply'],
    'house': ['Parking', 'Garden', 'Security', 'Power Backup'],
    'villa': ['Parking', 'Garden', 'Swimming Pool', 'Security', 'Power Backup', 'Gym'],
    'studio': ['WiFi', 'AC', 'Furnished', 'Water Supply'],
    'pg': ['WiFi', 'Meals', 'Laundry', 'Security', 'Water Supply']
}

# Common amenities suggestions
ALL_AMENITIES = [
    'Parking', 'Lift', 'Security', 'Power Backup', 'Water Supply',
    'Garden', 'Gym', 'Swimming Pool', 'Club House', 'Play Area',
    'WiFi', 'AC', 'Geyser', 'Washing Machine', 'Refrigerator',
    'TV', 'Sofa', 'Bed', 'Wardrobe', 'Dining Table',
    'Modular Kitchen', 'RO Water', 'Gas Pipeline', 'Intercom',
    'CCTV', 'Fire Safety', 'Earthquake Resistant', 'Vastu Compliant'
]


def detect_property_type(title: str, description: str) -> tuple:
    """Detect property type from text with confidence score"""
    text = f"{title} {description}".lower()
    
    type_scores = {}
    for ptype, keywords in PROPERTY_TYPE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            type_scores[ptype] = score
    
    if not type_scores:
        return 'apartment', 0.3  # Default with low confidence
    
    best_type = max(type_scores, key=type_scores.get)
    max_possible = len(PROPERTY_TYPE_KEYWORDS[best_type])
    confidence = min(type_scores[best_type] / max_possible + 0.3, 1.0)
    
    return best_type, confidence


def evaluate_description(description: str) -> str:
    """Evaluate description quality"""
    if not description:
        return 'poor'
    
    length = len(description)
    word_count = len(description.split())
    
    # Check for key details
    has_location = any(word in description.lower() for word in ['near', 'close to', 'walking distance', 'sector', 'colony', 'road'])
    has_features = any(word in description.lower() for word in ['room', 'bathroom', 'kitchen', 'balcony', 'floor', 'area'])
    has_condition = any(word in description.lower() for word in ['new', 'renovated', 'maintained', 'spacious', 'bright', 'ventilated'])
    
    detail_score = sum([has_location, has_features, has_condition])
    
    if length >= 300 and word_count >= 50 and detail_score >= 2:
        return 'excellent'
    if length >= 150 and word_count >= 30 and detail_score >= 1:
        return 'good'
    if length >= 50 and word_count >= 10:
        return 'fair'
    return 'poor'


def find_missing_amenities(property_type: str, current_amenities: List[str]) -> List[str]:
    """Find missing required amenities"""
    required = REQUIRED_AMENITIES.get(property_type, REQUIRED_AMENITIES['apartment'])
    current_lower = [a.lower() for a in current_amenities]
    
    missing = []
    for amenity in required:
        if not any(amenity.lower() in ca for ca in current_lower):
            missing.append(amenity)
    
    return missing


def generate_suggestions(
    title: str, 
    description: str, 
    property_type: str,
    bhk: int,
    rent: float,
    city: str,
    area_name: str,
    amenities: List[str]
) -> List[str]:
    """Generate improvement suggestions"""
    suggestions = []
    
    # Title suggestions
    if not title or len(title) < 15:
        suggestions.append(f"Add a descriptive title like '{bhk or 2}BHK {property_type.title()} in {area_name or city}'")
    
    # Description suggestions
    desc_lower = description.lower() if description else ''
    
    if 'near' not in desc_lower and 'close to' not in desc_lower:
        suggestions.append("Mention nearby landmarks, schools, hospitals, or markets")
    
    if 'floor' not in desc_lower and property_type == 'apartment':
        suggestions.append("Mention which floor the property is on")
    
    if 'facing' not in desc_lower:
        suggestions.append("Add facing direction (East/West/North/South facing)")
    
    if 'age' not in desc_lower and 'year' not in desc_lower and 'old' not in desc_lower:
        suggestions.append("Mention the property age or construction year")
    
    if len(amenities) < 5:
        suggestions.append("Add more amenities to make the listing more attractive")
    
    # Price suggestions
    if rent:
        if 'negotiable' not in desc_lower:
            suggestions.append("Mention if rent is negotiable")
        if 'maintenance' not in desc_lower:
            suggestions.append("Clarify if maintenance charges are included")
    
    return suggestions[:5]  # Limit to 5 suggestions


def generate_issues(
    title: str,
    description: str,
    property_type: str,
    amenities: List[str]
) -> List[str]:
    """Generate critical issues that need fixing"""
    issues = []
    
    if not title or len(title) < 5:
        issues.append("Title is required and should be descriptive")
    
    if not description or len(description) < 30:
        issues.append("Description is too short. Add at least 50 characters describing the property")
    
    if len(amenities) == 0:
        issues.append("At least 3 amenities are required for the listing")
    
    # Check for spam patterns
    if description:
        spam_patterns = ['call now', 'urgent', 'whatsapp only', 'contact:']
        if any(pattern in description.lower() for pattern in spam_patterns):
            issues.append("Remove contact details and promotional text from description")
    
    return issues


# Try to use AI for enhanced analysis
async def ai_analyze_property(data: PropertyValidationRequest) -> dict:
    """Use AI for enhanced property analysis"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        from dotenv import load_dotenv
        load_dotenv()
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return None
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"property-validation-{data.title[:20]}",
            system_message="""You are a real estate listing validator. Analyze property listings and provide:
1. Detected property type (apartment/house/villa/studio/pg)
2. Description quality assessment
3. Missing important details
4. Suggestions for improvement

Be concise and return JSON-like structured feedback."""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Analyze this property listing:

Title: {data.title}
Description: {data.description}
Listed Type: {data.property_type or 'Not specified'}
Amenities: {', '.join(data.amenities) if data.amenities else 'None listed'}
BHK: {data.bhk or 'Not specified'}
Rent: ₹{data.rent or 'Not specified'}
City: {data.city or 'Not specified'}
Area: {data.area_name or 'Not specified'}

Provide brief analysis with:
1. Is the property type correctly identified?
2. What important details are missing from the description?
3. What amenities should be added?
4. One sentence improved description if current one is poor."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"ai_feedback": response}
        
    except Exception as e:
        print(f"AI analysis error: {e}")
        return None


@router.post("/admin/property/ai-validate", response_model=PropertyValidationResponse)
async def validate_property(
    data: PropertyValidationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    AI-powered property validation
    Analyzes title, description, and suggests improvements
    """
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Detect property type
    detected_type, confidence = detect_property_type(data.title, data.description)
    
    # If user specified a type and it matches, increase confidence
    if data.property_type and data.property_type.lower() == detected_type:
        confidence = min(confidence + 0.2, 1.0)
    
    # Evaluate description
    description_quality = evaluate_description(data.description)
    
    # Find missing amenities
    missing_amenities = find_missing_amenities(detected_type, data.amenities)
    
    # Generate suggestions
    suggestions = generate_suggestions(
        data.title,
        data.description,
        detected_type,
        data.bhk,
        data.rent,
        data.city,
        data.area_name,
        data.amenities
    )
    
    # Generate issues
    issues = generate_issues(
        data.title,
        data.description,
        detected_type,
        data.amenities
    )
    
    # Try AI analysis for enhanced feedback
    ai_result = await ai_analyze_property(data)
    enhanced_description = None
    
    if ai_result and ai_result.get('ai_feedback'):
        # Parse AI feedback for additional suggestions
        ai_feedback = ai_result['ai_feedback']
        if 'missing' in ai_feedback.lower():
            # Extract any additional suggestions from AI
            pass
    
    return PropertyValidationResponse(
        detected_type=detected_type,
        type_confidence=confidence,
        description_quality=description_quality,
        missing_amenities=missing_amenities,
        suggestions=suggestions,
        issues=issues,
        enhanced_description=enhanced_description
    )


@router.get("/admin/property/amenities-list")
async def get_amenities_list(current_user: dict = Depends(get_current_user)):
    """Get list of all available amenities"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "all_amenities": ALL_AMENITIES,
        "required_by_type": REQUIRED_AMENITIES
    }
