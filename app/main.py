from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine, ensure_database_schema
import app.models.user
import app.models.otp
from .routers import auth, tts, voice_clone, voice_mixer, admin
from .config import get_settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create database tables and align any existing schema with the current auth models
ensure_database_schema()

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI Voice Generation Platform - Python-only tech stack",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tts.router, prefix="/api/tts", tags=["Text-to-Speech"])
app.include_router(voice_clone.router, prefix="/api/voice-clone", tags=["Voice Cloning"])
app.include_router(voice_mixer.router, prefix="/api/voice-mixer", tags=["Voice Mixer"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Root endpoints
@app.get("/")
def root():
    return {
        "message": "VoxForge AI - Python Voice Generation Platform",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}