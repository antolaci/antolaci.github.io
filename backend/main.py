from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from redis import asyncio as redis

# Load environment variables
load_dotenv()

app = FastAPI()

# Security setup
api_key_header = APIKeyHeader(name="X-API-Key")

# Rate limiting setup (Redis required on Render.com)
@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_connection = redis.from_url(redis_url)
    await FastAPILimiter.init(redis_connection)

# Production CORS configuration (adjust to your GitHub Pages URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourusername.github.io"],  # Your GH Pages domain
    allow_credentials=True,
    allow_methods=["POST"],  # Only allow POST for security
    allow_headers=["X-API-Key", "Content-Type"],
)

# Configuration
class Config:
    CORRECT_CODE = os.getenv("CORRECT_CODE")
    SHELLY_AUTH_KEY = os.getenv("SHELLY_AUTH_KEY")
    SHELLY_DEVICE_ID = os.getenv("SHELLY_DEVICE_ID")
    SHELLY_CHANNEL = int(os.getenv("SHELLY_CHANNEL", "0"))
    TOGGLE_AFTER = int(os.getenv("TOGGLE_AFTER", "5"))
    API_KEYS = os.getenv("API_KEYS", "").split(",")

config = Config()

# Models
class CodeValidationRequest(BaseModel):
    code: str

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key not in config.API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

@app.post("/api/validate-code")
@RateLimiter(times=5, minutes=1)  # 5 attempts per minute
async def validate_code(
    request: CodeValidationRequest,
    api_key: str = Depends(verify_api_key)
):
    if not config.CORRECT_CODE:
        raise HTTPException(status_code=500, detail="Server misconfigured")
    
    if request.code != config.CORRECT_CODE:
        return {"success": False, "message": "Invalid access code"}
    
    try:
        async with httpx.AsyncClient() as client:
            shelly_response = await client.post(
                f"https://api.shelly.cloud/v2/devices/api/set/switch?auth_key={config.SHELLY_AUTH_KEY}",
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

# Health check endpoint for Render
@app.get("/health")
async def health_check():
    return {"status": "healthy"}