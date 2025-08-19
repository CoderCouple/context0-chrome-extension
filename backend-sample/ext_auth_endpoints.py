"""
Sample backend endpoints for Chrome Extension authentication sync.
Add these to your FastAPI backend.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import redis
import json

# Initialize Redis client (or use in-memory cache)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

router = APIRouter(prefix="/api/v1", tags=["Extension Auth"])

class ExtAuthComplete(BaseModel):
    """Request model for completing extension authentication"""
    session_id: str
    clerk_token: str
    user_data: Dict[str, any]

class ExtAuthStatus(BaseModel):
    """Response model for auth status"""
    status: str  # 'pending', 'completed', 'expired'
    clerk_token: Optional[str] = None
    user_data: Optional[Dict[str, any]] = None

@router.get("/ext-auth-status")
async def get_extension_auth_status(session_id: str):
    """
    Check authentication status for Chrome extension.
    Used by extension to poll for auth completion.
    """
    try:
        # Check Redis for session data
        cache_key = f"ext_auth:{session_id}"
        cached_data = redis_client.get(cache_key)
        
        if not cached_data:
            # Session not found or expired
            return {
                "success": True,
                "result": {
                    "status": "pending"
                },
                "message": "Authentication pending"
            }
        
        # Parse cached data
        auth_data = json.loads(cached_data)
        
        # Delete from cache after retrieval (one-time use)
        redis_client.delete(cache_key)
        
        return {
            "success": True,
            "result": {
                "status": "completed",
                "clerk_token": auth_data["clerk_token"],
                "user_data": auth_data["user_data"]
            },
            "message": "Authentication completed successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "result": None,
            "message": f"Error checking auth status: {str(e)}",
            "status_code": 500
        }

@router.post("/ext-auth-complete")
async def complete_extension_auth(
    request: ExtAuthComplete,
    # Add your authentication dependency here to verify the Clerk token
    # current_user = Depends(get_current_user_from_clerk_token)
):
    """
    Called by frontend after successful Clerk authentication.
    Stores auth data temporarily for extension to retrieve.
    """
    try:
        # Validate the Clerk token here
        # You should verify the token with Clerk before storing
        
        # Store in Redis with 5-minute TTL
        cache_key = f"ext_auth:{request.session_id}"
        cache_data = {
            "clerk_token": request.clerk_token,
            "user_data": request.user_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Set with 5-minute expiration
        redis_client.setex(
            cache_key,
            timedelta(minutes=5),
            json.dumps(cache_data)
        )
        
        return {
            "success": True,
            "result": {
                "session_id": request.session_id,
                "status": "stored"
            },
            "message": "Authentication data stored successfully",
            "status_code": 200
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store auth data: {str(e)}"
        )

# Alternative in-memory implementation if Redis is not available
class InMemoryAuthStore:
    """Simple in-memory store for development/testing"""
    def __init__(self):
        self.store: Dict[str, Dict] = {}
        self.expiry: Dict[str, datetime] = {}
    
    def set(self, key: str, value: Dict, ttl_seconds: int = 300):
        self.store[key] = value
        self.expiry[key] = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self._cleanup_expired()
    
    def get(self, key: str) -> Optional[Dict]:
        self._cleanup_expired()
        if key in self.store and key in self.expiry:
            if datetime.utcnow() < self.expiry[key]:
                return self.store[key]
        return None
    
    def delete(self, key: str):
        self.store.pop(key, None)
        self.expiry.pop(key, None)
    
    def _cleanup_expired(self):
        now = datetime.utcnow()
        expired_keys = [k for k, exp in self.expiry.items() if exp < now]
        for key in expired_keys:
            self.delete(key)

# Uncomment to use in-memory store instead of Redis
# auth_store = InMemoryAuthStore()