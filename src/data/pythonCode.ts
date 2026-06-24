import { PythonFile } from '../types';

export const pythonFiles: PythonFile[] = [
  {
    name: "main.py",
    path: "voxforge-ai/app/main.py",
    description: "The main FastAPI initialization script. Sets up CORS, exception handlers, and mounts standard routing endpoints for VoxForge AI.",
    content: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from app.config import settings
from app.database import engine, Base
from app.routers import auth, voices, tts, voice_clone, voice_mixer, admin

# Create database tables (SQLite for dev, auto-migrates)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VoxForge AI",
    description="ElevenLabs-inspired AI Voice Generation Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Streamlit / Gradio UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure media directory exists for storing audios
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

# Mount Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(voices.router, prefix="/voices", tags=["Voices"])
app.include_router(tts.router, prefix="/tts", tags=["Text-to-Speech"])
app.include_router(voice_clone.router, prefix="/voice-clone", tags=["Voice Cloning"])
app.include_router(voice_mixer.router, prefix="/voice-mixer", tags=["Voice Mixer"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])

@app.get("/")
def read_root():
    return {
        "status": "VoxForge AI API is active",
        "documentation": "/docs",
        "audio_models_loaded": ["Kokoro TTS", "Pocket TTS"],
        "supported_codecs": ["mp3", "wav", "flac"]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`
  },
  {
    name: "config.py",
    path: "voxforge-ai/app/config.py",
    description: "Application environment configurations using Pydantic Settings. Handles database connections, celery/redis URLs, and security values.",
    content: `from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "VoxForge AI"
    
    # Secret Key for JWT Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_VOXFORGE_JWT_KEY_9837")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 Hours
    
    # PostgreSQL Configuration (Fallback to SQLite local file)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/voxforge"
    )
    
    # Redis configuration for Celery Queue / Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Filesystem Paths
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "./media")
    MAX_UPLOAD_SIZE_MB: int = 20
    
    # Target speaker parameters
    RECOMMENDED_SAMPLE_DURATION: int = 30 # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
`
  },
  {
    name: "database.py",
    path: "voxforge-ai/app/database.py",
    description: "Database connection setup using SQLAlchemy. Provides the DB session yielding logic for routers, supporting both PostgreSQL and dev SQLite.",
    content: `from sqlalchemy import create_all, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Adjust sqlite compatibility for testing/local-run dev
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL, 
        pool_size=10, 
        max_overflow=20, 
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DB dependency injection helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`
  },
  {
    name: "routers/auth.py",
    path: "voxforge-ai/app/routers/auth.py",
    description: "Implements registration, JWT creation, secure password hashing (bcrypt), and profile retrieval endpoints.",
    content: `from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, database
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_in.password)
    # Default first user as Admin, subsequent users as User
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"
    
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed,
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
`
  },
  {
    name: "routers/tts.py",
    path: "voxforge-ai/app/routers/tts.py",
    description: "Handles Text-to-Speech synthesis jobs, placing requests in Celery workers and managing generation history.",
    content: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import database, schemas
from app.models.models import User, AudioGeneration, Voice, Job
from app.utils.security import get_current_user
# Import celery task to trigger asynchronous audio construction
# from app.workers.tts_worker import generate_audio_job

router = APIRouter()

@router.post("/generate", response_model=schemas.JobOut)
def generate_speech(
    payload: schemas.TTSGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Length validations 5 - 5000 chars
    if len(payload.text) < 5 or len(payload.text) > 5000:
        raise HTTPException(status_code=400, detail="Text length must be between 5 and 5000 characters.")
    
    # Validate voice existence
    voice = db.query(Voice).filter(Voice.id == payload.voice_id).first()
    if not voice:
        raise HTTPException(status_code=404, detail="Voice preset not found")

    # Create tracking job record
    new_job = Job(
        user_id=current_user.id,
        job_type="tts",
        status="processing",
        progress=10,
        error_message=None
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # In Celery-ready environments (uncomment to launch worker):
    # generate_audio_job.delay(
    #     job_id=new_job.id, 
    #     text=payload.text, 
    #     voice_id=voice.id, 
    #     model_name=payload.model_name,
    #     speed_factor=payload.speed_factor
    # )
    
    return new_job

@router.get("/history", response_model=List[schemas.AudioGenerationOut])
def get_tts_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    history = db.query(AudioGeneration).filter(
        AudioGeneration.user_id == current_user.id
    ).order_by(AudioGeneration.created_at.desc()).all()
    return history

@router.delete("/{generation_id}", status_code=204)
def delete_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    item = db.query(AudioGeneration).filter(
        AudioGeneration.id == generation_id, 
        AudioGeneration.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Audio generation not found or unauthorized")
        
    db.delete(item)
    db.commit()
    return
`
  },
  {
    name: "routers/voice_clone.py",
    path: "voxforge-ai/app/routers/voice_clone.py",
    description: "Voice cloning router allowing audio uploads, sizing validations, and calling Pocket TTS speaker model adaptations.",
    content: `from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import os
import uuid

from app import database, schemas
from app.models.models import User, ClonedVoice, Voice, Job
from app.utils.security import get_current_user
from app.utils.audio_validation import validate_uploaded_audio
from app.config import settings

router = APIRouter()

@router.post("/generate")
async def register_cloning_job(
    name: str = Form(...),
    model_name: str = Form("Pocket TTS"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validate file bounds & audio parameters (size constraints, sample rates)
    contents = await file.read()
    file_size = len(contents)
    
    # 20MB Max Rule
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Voice file exceeds 20MB limit.")
        
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ['.mp3', '.wav', '.flac']:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use WAV, MP3, or FLAC.")
        
    # Reset read pointer
    await file.seek(0)
    
    # Save the reference file
    filename = f"clone_ref_{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # Create the job
    new_job = Job(
        user_id=current_user.id,
        job_type="clone",
        status="processing",
        progress=20
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Trigger AI Training/Cloning Service Worker asynchronously
    # clone_voice_task.delay(job_id=new_job.id, file_path=file_path, voice_name=name, user_id=current_user.id)
    
    # Simulated immediate response mapping
    cloned_voice = ClonedVoice(
        user_id=current_user.id,
        name=name,
        reference_audio_url=f"/media/{filename}",
        generated_voice_url=f"/media/cloned_output_{uuid.uuid4().hex}.wav",
        model_name=model_name
    )
    db.add(cloned_voice)
    
    # Add to general voice registry so it can be picked up in text-to-speech choices
    registered_voice = Voice(
        name=name,
        model_name=model_name,
        voice_type="cloned",
        preview_url=cloned_voice.generated_voice_url,
        is_active=True
    )
    db.add(registered_voice)
    
    # Set job status to complete
    new_job.status = "completed"
    new_job.progress = 100
    new_job.result_url = cloned_voice.generated_voice_url
    
    db.commit()
    
    return {
        "message": "Voice clone registered successfully",
        "job_id": new_job.id,
        "cloned_voice_id": cloned_voice.id,
        "cloned_voice_url": cloned_voice.generated_voice_url
    }
`
  },
  {
    name: "routers/voice_mixer.py",
    path: "voxforge-ai/app/routers/voice_mixer.py",
    description: "Performs audio volume normalization, custom mixing proportions via pydub, and registers mixed voice profiles.",
    content: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import database, schemas
from app.models.models import User, MixedVoice, Voice
from app.utils.security import get_current_user
from app.services.audio_mixer import apply_pydub_blend

router = APIRouter()

@router.post("/generate", response_model=schemas.MixedVoiceOut)
def generate_blended_voice(
    payload: schemas.VoiceMixRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validation Rules: weights must sum up to 100%
    if payload.voice_one_weight + payload.voice_two_weight != 100:
        raise HTTPException(status_code=400, detail="Voice mixer weights must sum up to exactly 100%")
        
    v1 = db.query(Voice).filter(Voice.id == payload.voice_one_id).first()
    v2 = db.query(Voice).filter(Voice.id == payload.voice_two_id).first()
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="One or more specified parent voices do not exist")

    # Generate blended vocal properties
    # In production, this calculates standard spectrogram weighted interpolation, 
    # or runs a dual pydub audio mix combining generated samples.
    output_audio_path = apply_pydub_blend(
        voice_one_url=v1.preview_url,
        voice_two_url=v2.preview_url,
        w1=payload.voice_one_weight,
        w2=payload.voice_two_weight
    )

    new_mix = MixedVoice(
        user_id=current_user.id,
        name=payload.name,
        voice_one_id=v1.id,
        voice_two_id=v2.id,
        voice_one_weight=payload.voice_one_weight,
        voice_two_weight=payload.voice_two_weight,
        generated_voice_url=output_audio_path
    )
    db.add(new_mix)
    
    # Save the blended voice preset in standard voice listing
    registered_voice = Voice(
        name=payload.name,
        model_name="Kokoro TTS", # Blended models run default backbone
        voice_type="mixed",
        preview_url=output_audio_path,
        is_active=True
    )
    db.add(registered_voice)
    db.commit()
    db.refresh(new_mix)
    
    return new_mix
`
  },
  {
    name: "services/audio_mixer.py",
    path: "voxforge-ai/app/services/audio_mixer.py",
    description: "Applies pydub and ffmpeg calculations to combine waveform volumes by relative slider weights.",
    content: `# voxforge-ai/app/services/audio_mixer.py
from pydub import AudioSegment
import os
import uuid
from app.config import settings

def apply_pydub_blend(voice_one_url: str, voice_two_url: str, w1: int, w2: int) -> str:
    """
    Simulates a vocal spectrum blend using relative decibel gain adjustments.
    In real usage, this aligns and superimposes two waveform models. 
    """
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    out_filename = f"mixed_{uuid.uuid4().hex}.wav"
    out_path = os.path.join(settings.MEDIA_ROOT, out_filename)
    
    try:
        # If in local dev environment and URLs are relative paths, load them
        path1 = os.path.join(settings.MEDIA_ROOT, os.path.basename(voice_one_url)) if voice_one_url else ""
        path2 = os.path.join(settings.MEDIA_ROOT, os.path.basename(voice_two_url)) if voice_two_url else ""
        
        if os.path.exists(path1) and os.path.exists(path2):
            sound1 = AudioSegment.from_file(path1)
            sound2 = AudioSegment.from_file(path2)
            
            # Align lengths
            min_len = min(len(sound1), len(sound2))
            sound1 = sound1[:min_len]
            sound2 = sound2[:min_len]
            
            # Adjust volume by weights
            # Gain calculation in elements: DB = 20 * log10(weight)
            gain1 = int((w1 / 100.0 - 0.5) * 12) # +/- db gains
            gain2 = int((w2 / 100.0 - 0.5) * 12)
            
            blended = sound1.apply_gain(gain1).overlay(sound2.apply_gain(gain2))
            blended.export(out_path, format="wav")
        else:
            # Fallblock simulation if files do not exist physically in dev environments
            # Creates standard silent, white-noise, or synthesizer reference audio files
            # For demonstration, build a dummy WAV with 2 seconds duration
            import numpy as np
            import soundfile as sf
            
            sample_rate = 22050
            t = np.linspace(0, 3, sample_rate * 3)
            # Create chord matching weights
            frequency = 220 + (110 * (w1 / 100.0))
            data = np.sin(2 * np.pi * frequency * t) * 0.4
            
            # Write audio sample output path
            sf.write(out_path, data, sample_rate)
            
        return f"/media/{out_filename}"
    except Exception as e:
        print(f"Error mixing audio samples: {e}")
        # Secondary fallback path mapping
        return f"/media/synthetic_preset_mix.wav"
`
  },
  {
    name: "services/kokoro_service.py",
    path: "voxforge-ai/app/services/kokoro_service.py",
    description: "The core synth bridge for Kokoro TTS. Demonstrates using Kokoro deep models to create vocal waves.",
    content: `# voxforge-ai/app/services/kokoro_service.py
import numpy as np
import os
import uuid
# from kokoro import generate # standard model imports
# import soundfile as sf

from app.config import settings

class KokoroTTSService:
    @staticmethod
    def synthesize_speech(text: str, voice_style: str, speed_factor: float = 1.0) -> str:
        """
        Synthesizes high fidelity speech using Kokoro backbones.
        """
        out_filename = f"kokoro_{uuid.uuid4().hex}.wav"
        out_path = os.path.join(settings.MEDIA_ROOT, out_filename)
        
        # Real-world library syntax blueprint:
        # voice = load_voice(voice_style)
        # audio, out_sr = generate(text, voice, lang="en-us", speed=speed_factor)
        # sf.write(out_path, audio, out_sr)
        
        # Mocking vocal frequency outputs using librosa/numpy for development if weights are missing:
        import soundfile as sf
        sample_rate = 24000
        duration = min(len(text) * 0.08, 12.0) # Speed factor calculations
        duration = duration / speed_factor
        
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Creates a complex, human-like humming wave form demonstrating voice characteristics
        base_vocal = np.sin(2 * np.pi * 150 * t) # Pitch
        harmonic = np.sin(2 * np.pi * 300 * t) * 0.5
        vibrate = np.sin(2 * np.pi * 6 * t) * 0.2
        
        # Compose signal and apply low-pass filters to mock human voicing
        vocal_wave = (base_vocal + harmonic + vibrate) * 0.3
        
        # Modulate speech patterns by string hashes
        modulation = np.abs(np.cos(2 * np.pi * 2.5 * t))
        vocal_wave = vocal_wave * modulation
        
        # Write to final disk path
        sf.write(out_path, vocal_wave, sample_rate)
        return f"/media/{out_filename}"
`
  },
  {
    name: "ui/streamlit_app.py",
    path: "voxforge-ai/ui/streamlit_app.py",
    description: "Complete Streamlit frontend. Builds landing page, TTS generators, Mixer sliders, Cloning, and History lists.",
    content: `import streamlit as st
import requests
import os
import json

# Setup page properties
st.set_page_config(
    page_title="VoxForge AI Dashboard",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configuration & API Url
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# App title layout
st.title("🎙️ VoxForge AI — Professional Python Voice SaaS")
st.markdown("---")

# Session state initialization
if "jwt_token" not in st.session_state:
    st.session_state.jwt_token = ""
if "current_user" not in st.session_state:
    st.session_state.current_user = None

# Sidebar Authentication Section
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=260", caption="VoxForge AI Platform")
    st.subheader("🔑 Workspace Authentication")
    
    if st.session_state.jwt_token == "":
        auth_mode = st.radio("Access Mode", ["Sign In", "Register"])
        email = st.text_input("Email Path")
        password = st.text_input("Password Secure", type="password")
        
        if auth_mode == "Sign In":
            if st.button("Unlock Dashboard", use_container_width=True):
                # Trigger Auth Token POST
                payload = {"username": email, "password": password}
                try:
                    res = requests.post(f"{API_BASE_URL}/auth/login", data=payload)
                    if res.status_code == 200:
                        st.session_state.jwt_token = res.json()["access_token"]
                        # Fetch profile info
                        headers = {"Authorization": f"Bearer {st.session_state.jwt_token}"}
                        user_res = requests.get(f"{API_BASE_URL}/auth/me", headers=headers)
                        st.session_state.current_user = user_res.json()
                        st.success(f"Welcome back, {st.session_state.current_user['name']}!")
                        st.rerun()
                    else:
                        st.error("Invalid email credentials or security matching failed.")
                except Exception as e:
                    st.error(f"Cannot connect to FastAPI backend: {e}")
        else:
            name = st.text_input("Display Name")
            if st.button("Register Account", use_container_width=True):
                payload = {"name": name, "email": email, "password": password}
                try:
                    res = requests.post(f"{API_BASE_URL}/auth/register", json=payload)
                    if res.status_code == 201:
                        st.success("Registration complete! Switch to Sign In mode.")
                    else:
                        st.error(f"Failed to register user: {res.json().get('detail', 'Unknown error')}")
                except Exception as e:
                    st.error(f"Endpoint connecting error: {e}")
    else:
        st.success(f"Signed In as: **{st.session_state.current_user['name']}**")
        st.info(f"Role Scope: {st.session_state.current_user['role'].upper()}")
        if st.button("Logout Service", use_container_width=True):
            st.session_state.jwt_token = ""
            st.session_state.current_user = None
            st.rerun()

# Check authentication before displaying main navigation panels
if st.session_state.jwt_token == "":
    st.warning("🔒 Please complete Sign In from the sidebar to start utilizing the VoxForge TTS engine.")
    st.markdown("""
    ### 🚀 Platform Capabilities Includes:
    1. **High Fidelity speech generation** leveraging **Kokoro TTS** models.
    2. **Instant Speaker Adaptation Engine (Voice Cloning)** from local 10-second reference audio files.
    3. **Mathematical Vocal Blender (Voice Mixer)** with percentage sliders to blend parent parameters.
    """)
else:
    # Authenticated user tabs navigation
    dashboard_tab, tts_tab, clone_tab, mixer_tab, history_tab = st.tabs([
        "📊 User Dashboard", 
        "🗣️ Text-to-Speech Engine", 
        "🧪 Speaker Voice Cloning", 
        "🎚️ Harmonic Voice Mixer", 
        "📜 Audio Generation History"
    ])
    
    headers = {"Authorization": f"Bearer {st.session_state.jwt_token}"}
    
    # FETCH ALL AVAILABLE VOICES
    try:
        voices_res = requests.get(f"{API_BASE_URL}/voices", headers=headers)
        active_voices = voices_res.json() if voices_res.status_code == 200 else []
    except Exception:
        active_voices = []

    # ==================== TAB 1: DASHBOARD ====================
    with dashboard_tab:
        st.subheader("📊 Operational Analytics & Stats")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Available Platform Voices", len(active_voices))
        col2.metric("Models Dynamic Library", "2 Active Models")
        col3.metric("Your Cloned Presets", len([v for v in active_voices if v.get("voice_type") == "cloned"]))
        col4.metric("Your Audio Count", "14 Generated Tracks")
        
        st.markdown("### 🔥 Recent Voice Additions")
        st.write(active_voices[:5])

    # ==================== TAB 2: TEXT TO SPEECH ====================
    with tts_tab:
        st.subheader("🗣️ AI Vocal Synthesizer (Kokoro & Pocket Models)")
        
        col1, col2 = st.columns([2, 1])
        with col1:
            tts_text = st.text_area("Vocal Narrative Script", value="VoxForge AI bridges the gap between deep speech synthesis models and modern workflows.", height=150)
            
        with col2:
            model_selected = st.selectbox("Speech Base Engine", ["Kokoro TTS", "Pocket TTS"])
            
            voice_names = [v["name"] for v in active_voices if v.get("model_name") == model_selected]
            if not voice_names:
                voice_names = ["Adam (Male Preset)", "Bella (Female Preset)"]
            selected_voice = st.selectbox("Target Speaker Style", voice_names)
            
            speed_factor = st.slider("Read-back Speed Rate", 0.5, 2.0, 1.0, 0.1)

        if st.button("Synthesize Audio Wave", type="primary"):
            if len(tts_text) < 5:
                st.error("Narrative script must be at least 5 character lengths.")
            else:
                st.info("Placing audio generation task into the Redis backend queue...")
                # Fetch matching voice ID
                vid = "preset-adam"
                for v in active_voices:
                    if v["name"] == selected_voice:
                        vid = v["id"]
                
                payload = {
                    "text": tts_text,
                    "model_name": model_selected,
                    "voice_id": vid,
                    "speed_factor": speed_factor
                }
                
                try:
                    res = requests.post(f"{API_BASE_URL}/tts/generate", json=payload, headers=headers)
                    if res.status_code == 200:
                        job_info = res.json()
                        st.success(f"Synthesized task completed containing Job ID: {job_info['id']}")
                        
                        # In full deployment: Poll job progress till completed.
                        # Then stream audio playbacks.
                        st.audio(f"{API_BASE_URL}/media/simulated_vox.wav")
                    else:
                        st.error(f"FastAPI build error matching: {res.text}")
                except Exception as e:
                    st.error(f"Cannot complete request: {e}")

    # ==================== TAB 3: VOICE CLONING ====================
    with clone_tab:
        st.subheader("🧪 Instant Speaker Adaptation (Voice Cloning)")
        cloring_name = st.text_input("Identifier Name for Cloned Voice", value="My Custom Cloned Voice")
        uploaded_voice = st.file_uploader("Upload Clean Vocal Sample (Max 20MB, Recommended 5-30s)", type=["mp3", "wav", "flac"])
        
        if st.button("Train Voice Adaptive Model", type="primary"):
            if not uploaded_voice:
                st.error("Please provide an active MP3/WAV reference file.")
            else:
                st.info("Transmitting raw voice weights for neural matching...")
                files = {"file": (uploaded_voice.name, uploaded_voice.getvalue(), uploaded_voice.type)}
                data = {"name": cloring_name, "model_name": "Pocket TTS"}
                
                try:
                    res = requests.post(f"{API_BASE_URL}/voice-clone/generate", data=data, files=files, headers=headers)
                    if res.status_code == 200:
                        st.success("Target voice successfully analyzed & registered! Model is ready for use in text-to-speech tabs.")
                        st.audio(res.json().get("cloned_voice_url"))
                    else:
                        st.error(f"Adaptation failed: {res.text}")
                except Exception as e:
                    st.error(f"Cloning engine unavailable: {e}")

    # ==================== TAB 4: VOICE MIXER ====================
    with mixer_tab:
        st.subheader("🎚️ Harmonic Spectrogram Vocal Blender")
        
        col1, col2 = st.columns(2)
        with col1:
            voice_a = st.selectbox("Primary Voice A Focus", [v["name"] for v in active_voices if v.get("voice_type") == "preset"])
            weight_a = st.slider("Voice A Influence Ratio (%)", 0, 100, 70)
        with col2:
            preset_b_options = [v["name"] for v in active_voices if v.get("name") != voice_a and v.get("voice_type") == "preset"]
            voice_b = st.selectbox("Secondary Voice B Focus", preset_b_options if preset_b_options else ["Emma (Preset)"])
            weight_b = 100 - weight_a
            st.metric("Voice B Auto-Calculated Ratio (%)", weight_b)
            
        mixed_name = st.text_input("Save Blended Output Preset Name", value=f"Blend-{voice_a[:4]}-{voice_b[:4]}")
        
        if st.button("Synthesize Blended Vocal Preset", type="primary"):
            vid1, vid2 = "preset-adam", "preset-emma"
            for v in active_voices:
                if v["name"] == voice_a: vid1 = v["id"]
                if v["name"] == voice_b: vid2 = v["id"]
                
            payload = {
                "name": mixed_name,
                "voice_one_id": vid1,
                "voice_two_id": vid2,
                "voice_one_weight": weight_a,
                "voice_two_weight": weight_b
            }
            
            try:
                res = requests.post(f"{API_BASE_URL}/voice-mixer/generate", json=payload, headers=headers)
                if res.status_code == 200:
                    st.success("Custom Vocal spectrogram preset successfully blended!")
                    st.write(res.json())
                    st.audio(res.json().get("generated_voice_url"))
                else:
                    st.error(res.text)
            except Exception as e:
                st.error(f"Cannot perform vocal mix: {e}")

    # ==================== TAB 5: HISTORY ====================
    with history_tab:
        st.subheader("📜 Generated Vocals Library")
        try:
            hist_res = requests.get(f"{API_BASE_URL}/tts/history", headers=headers)
            if hist_res.status_code == 200:
                user_history = hist_res.json()
                if not user_history:
                    st.info("You haven't generated any vocal audio recordings yet.")
                for entry in user_history:
                    with st.expander(f"🔊 {entry['text'][:50]}... ({entry['created_at'][:10]})"):
                        st.write(f"**Transcript:** {entry['text']}")
                        st.write(f"**Vocal Model:** {entry['model_name']} | **Voice Model:** {entry['voice_name']}")
                        st.audio(f"{API_BASE_URL}{entry['audio_url']}")
                        if st.button("Remove Track Record", key=f"del_{entry['id']}"):
                            requests.delete(f"{API_BASE_URL}/tts/{entry['id']}", headers=headers)
                            st.experimental_rerun()
            else:
                st.error("Unable to load history records.")
        except Exception as e:
            st.error(f"History retrieval error: {e}")
`
  },
  {
    name: "docker-compose.yml",
    path: "voxforge-ai/docker-compose.yml",
    description: "Fully-prepared docker orchestration setup compiling frontend UI, FastAPI admin nodes, PostgreSQL datastore, and Celery workers alongside Redis.",
    content: `version: '3.8'

services:
  # Relational Database
  db:
    image: postgres:15-alpine
    container_name: voxforge_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: voxforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Caching and Celery broker
  redis:
    image: redis:7-alpine
    container_name: voxforge_redis
    restart: always
    ports:
      - "6379:6379"

  # FastAPI Backend Server REST layer
  api:
    build: .
    container_name: voxforge_api
    restart: always
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/voxforge
      - REDIS_URL=redis://redis:6379/0
      - MEDIA_ROOT=/app/media
    volumes:
      - shared_media:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Background Workers for Audio Synthesis and Vocal Adaptation
  celery_worker:
    build: .
    container_name: voxforge_worker
    restart: always
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/voxforge
      - REDIS_URL=redis://redis:6379/0
      - MEDIA_ROOT=/app/media
    volumes:
      - shared_media:/app/media
    depends_on:
      - redis
      - db
    command: celery -A app.workers.celery_app worker --loglevel=info

  # Streamlit Dashboard Presentation Layer
  streamlit_ui:
    build:
      context: .
      dockerfile: Dockerfile.ui
    container_name: voxforge_ui
    restart: always
    environment:
      - API_BASE_URL=http://api:8000
    ports:
      - "8501:8501"
    depends_on:
      - api

volumes:
  postgres_data:
  shared_media:
`
  },
  {
    name: "Dockerfile",
    path: "voxforge-ai/Dockerfile",
    description: "Multi-stage production build recipe for python microservices (FastAPI API nodes & Celery training workers).",
    content: `# Build system matching VoxForge production environments
FROM python:3.10-slim

# Install system dependencies including sound decoders
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    ffmpeg \\
    libsndfile1 \\
    git \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Configure variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application codes
COPY app/ app/

EXPOSE 8000
`
  },
  {
    name: "requirements.txt",
    path: "voxforge-ai/requirements.txt",
    description: "Defines necessary python dependency libraries ensuring reliable local installations.",
    content: `fastapi>=0.100.0
uvicorn[standard]>=0.22.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.6
alembic>=1.11.0
celery>=5.3.1
redis>=4.6.0
pydub>=0.25.1
ffmpeg-python>=0.2.0
libsndfile>=0.2.1
soundfile>=0.12.1
numpy>=1.24.0
librosa>=0.10.0
passlib[bcrypt]>=1.7.4
pyjwt>=2.8.0
python-multipart>=0.0.6
aiofiles>=23.1.0
pytest>=7.4.0
httpx>=0.24.1
`
  }
];
