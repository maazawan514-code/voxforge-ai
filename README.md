# VoxForge AI - Python-Only Internship Project

AI Voice Generation Platform using Python, FastAPI, Streamlit, PostgreSQL, Redis, and Celery.

## Project Overview

VoxForge AI is an ElevenLabs-inspired AI voice generation platform designed for interns to learn practical AI application development using only Python-related technologies.

### Core Features

- **Text-to-Speech**: Generate realistic speech from text using Kokoro TTS or Pocket TTS
- **Voice Cloning**: Clone voices from audio samples using advanced AI models
- **Voice Mixer**: Blend multiple voices with custom percentage weights
- **Audio History**: Track and manage all generated audio files
- **User Authentication**: Secure registration and login with JWT tokens
- **Admin Controls**: Manage users, voices, models, and system logs
- **Background Jobs**: Async task processing with Celery and Redis

## Tech Stack

### Backend
- **Framework**: FastAPI + Uvicorn
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache/Queue**: Redis + Celery for background jobs
- **Authentication**: JWT tokens with passlib/bcrypt
- **TTS Models**: Kokoro TTS, Pocket TTS

### Frontend
- **UI**: Streamlit (Python-based)
- **HTTP Client**: Requests library

### Audio Processing
- **Libraries**: pydub, ffmpeg-python, librosa, soundfile, numpy

### Deployment
- **Containers**: Docker & Docker Compose
- **Server**: Gunicorn/Uvicorn

## Project Structure

```
voxforge-ai/
├── app/                          # FastAPI backend
│   ├── __init__.py
│   ├── main.py                   # Application entry point
│   ├── config.py                 # Configuration management
│   ├── database.py               # Database setup
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── user.py
│   │   └── voice.py
│   ├── schemas/                  # Pydantic validation schemas
│   │   ├── auth.py
│   │   ├── tts.py
│   │   ├── voice_clone.py
│   │   ├── voice_mixer.py
│   │   └── admin.py
│   ├── routers/                  # API route handlers
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── tts.py                # Text-to-Speech endpoints
│   │   ├── voice_clone.py        # Voice cloning endpoints
│   │   ├── voice_mixer.py        # Voice mixer endpoints
│   │   └── admin.py              # Admin endpoints
│   ├── services/                 # Business logic
│   │   ├── tts_service.py        # TTS generation
│   │   ├── voice_cloning_service.py
│   │   ├── audio_mixer.py        # Voice mixing
│   │   └── storage_service.py    # File storage
│   ├── utils/                    # Utility functions
│   │   ├── security.py           # Authentication & authorization
│   │   └── audio_validation.py   # Audio file validation
│   ├── workers/                  # Celery tasks
│   │   ├── celery_app.py
│   │   └── tasks.py
│   ├── generated_audio/          # Generated audio files
│   └── onnx/                     # ONNX model files
│
├── ui/                           # Streamlit web interface
│   ├── streamlit_app.py
│   └── README.md
│
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables example
├── docker-compose.yml            # Docker Compose configuration
├── README.md                     # This file
└── package.json                  # Legacy frontend (deprecated)
```

## Getting Started

### Prerequisites

- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Local Development Setup

#### 1. Clone and Setup Environment

```bash
# Clone repository
git clone <repo-url>
cd voxforge-ai

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

#### 2. Create Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Start Services with Docker Compose

```bash
# Start PostgreSQL, Redis, and other services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

#### 4. Initialize Database

```bash
# Create database tables
python -m alembic upgrade head

# Or manually create tables
python -c "from app.database import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine)"
```

#### 5. Run FastAPI Backend

```bash
# In one terminal
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Access API docs at: http://localhost:8000/docs

#### 6. Run Celery Worker (Optional)

```bash
# In another terminal
celery -A app.workers.celery_app worker --loglevel=info
```

#### 7. Run Streamlit UI

```bash
# In another terminal
streamlit run ui/streamlit_app.py
```

Access UI at: http://localhost:8501

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET  /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Text-to-Speech
- `POST /api/tts/generate` - Generate speech from text
- `GET  /api/tts/history` - Get generation history
- `GET  /api/tts/{generation_id}` - Get specific generation
- `DELETE /api/tts/{generation_id}` - Delete generation

### Voice Cloning
- `POST /api/voice-clone/generate` - Clone voice from sample
- `GET  /api/voice-clone/history` - Get cloning history
- `DELETE /api/voice-clone/{clone_id}` - Delete cloned voice

### Voice Mixer
- `POST /api/voice-mixer/generate` - Mix voices
- `GET  /api/voice-mixer/voices` - Get available voices
- `POST /api/voice-mixer/save-preset` - Save preset
- `GET  /api/voice-mixer/history` - Get presets

### Admin (requires admin role)
- `POST   /api/admin/voices` - Create voice
- `PUT    /api/admin/voices/{voice_id}` - Update voice
- `DELETE /api/admin/voices/{voice_id}` - Delete voice
- `GET    /api/admin/users` - List users
- `PUT    /api/admin/users/{user_id}/role` - Update user role
- `GET    /api/admin/jobs` - List background jobs
- `GET    /api/admin/stats` - System statistics

## Environment Variables

```env
# Application
APP_NAME=VoxForge AI
DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/voxforge_db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
MAX_UPLOAD_SIZE=20971520  # 20MB
UPLOAD_DIR=app/generated_audio

# API Keys
GEMINI_API_KEY=your-gemini-api-key
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Code Quality

```bash
# Format code
black app/ ui/

# Lint code
ruff check app/ ui/

# Type checking
mypy app/ ui/
```

## Deployment

### Using Docker Compose (Development)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

Use one of these platforms:
- **Railway**: `railway up`
- **Render**: Connect GitHub repo to Render
- **Fly.io**: `fly deploy`
- **DigitalOcean**: App Platform
- **AWS**: Elastic Container Service

## Roadmap

### Week 1: Setup & Foundation
- [x] Project structure
- [x] Database setup
- [x] FastAPI initialization
- [x] Streamlit UI scaffold

### Week 2: Authentication
- [x] User registration/login
- [x] JWT token implementation
- [x] Protected routes
- [ ] Password reset flow

### Week 3: TTS Implementation
- [ ] Kokoro TTS integration
- [ ] Pocket TTS integration
- [ ] Audio file storage
- [ ] Playback functionality

### Week 4: Voice Cloning
- [ ] Audio upload handling
- [ ] Validation pipeline
- [ ] Cloning model integration
- [ ] Result storage

### Week 5: Voice Mixer
- [ ] Voice weight mixing
- [ ] Audio blending
- [ ] Preset saving
- [ ] History tracking

### Week 6: Admin & Polish
- [ ] Admin panel
- [ ] User management
- [ ] Voice library management
- [ ] System monitoring

### Week 7-8: Testing & Deployment
- [ ] Unit testing
- [ ] Integration testing
- [ ] Docker setup
- [ ] Production deployment

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Last Updated**: 2026-06-23  
**Version**: 1.0.0-alpha
