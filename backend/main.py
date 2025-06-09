from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from redis import asyncio as redis

# Load environment variables
load_dotenv()

# Initialize FastAPI with rate limiting
app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Security setup
api_key_header = APIKeyHeader(name="X-API-Key")

# CORS configuration (adjust to your GitHub Pages URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourusername.github.io"],  # Your frontend URL
    allow_methods=["POST"],
    allow_headers=["X-API-Key", "Content-Type"]
)

# Configuration
class Config:
    CORRECT_CODE = os.getenv("CORRECT_CODE")
    SHELLY_AUTH_KEY = os.getenv("SHELLY_AUTH_KEY")
    SHELLY_DEVICE_ID = os.getenv("SHELLY_DEVICE_ID")
    SHELLY_CHANNEL = int(os.getenv("SHELLY_CHANNEL", "0"))
    TOGGLE_AFTER = int(os.getenv("TOGGLE_AFTER", "5"))
    API_KEYS = os.getenv("API_KEYS", "").split(",")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

config = Config()

# Models
class CodeValidationRequest(BaseModel):
    code: str

# Redis connection for rate limiting
@app.on_event("startup")
async def startup():
    app.state.redis = await redis.from_url(config.REDIS_URL)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key not in config.API_KEYS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
        )
    return api_key

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Try again in 1 minute."
    )

@app.post("/api/validate-code")
@limiter.limit("5/minute")
async def validate_code(
    request: Request,
    validation_request: CodeValidationRequest,
    api_key: str = Depends(verify_api_key)
):
    if not config.CORRECT_CODE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured"
        )
    
    if validation_request.code != config.CORRECT_CODE:
        return {"success": False, "message": "Invalid access code"}
    
    try:
        async with httpx.AsyncClient() as client:
            shelly_response = await client.post(
                f"https://https://shelly-124-eu.shelly.cloud/v2/devices/api/set/switch?auth_key={config.SHELLY_AUTH_KEY}",
                json={
                    "id": config.SHELLY_DEVICE_ID,
                    "channel": config.SHELLY_CHANNEL,
                    "on": True,
                    "toggle_after": config.TOGGLE_AFTER
                },
                timeout=10.0
            )
            
            if shelly_response.is_error:
                return {
                    "success": False,
                    "message": f"Failed to control door: {shelly_response.text}"
                }
            
            return {
                "success": True,
                "message": f"Door unlocked for {config.TOGGLE_AFTER} seconds"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error communicating with door controller: {str(e)}"
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "redis": "connected" if app.state.redis else "disconnected"}
