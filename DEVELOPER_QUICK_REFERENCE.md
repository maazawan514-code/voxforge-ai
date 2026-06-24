# VoxForge AI - Developer Quick Reference

**Fast lookup guide for developers working on VoxForge AI**

---

## 🚀 Quick Start (Copy & Paste)

```bash
# Setup
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && npm install
cp .env.example .env
docker-compose up -d && python app/init_db.py

# Development (4 terminals)
uvicorn app.main:app --reload              # Terminal 1: Backend
npm run dev                                 # Terminal 2: Frontend
celery -A app.workers.celery_app worker   # Terminal 3: Worker
docker-compose logs -f                     # Terminal 4: Logs

# Access
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

---

## 📂 Key File Locations

| What | Where | Lines |
|------|-------|-------|
| Entry Point | `app/main.py` | 1-50 |
| Models | `app/models/voice.py` | Full file |
| TTS Service | `app/services/tts_service.py` | 1-350 |
| TTS Routes | `app/routers/tts.py` | 1-200 |
| Voice Clone Service | `app/services/voice_cloning_service.py` | 1-300 |
| Clone Routes | `app/routers/voice_clone.py` | 1-180 |
| Mixer Routes | `app/routers/voice_mixer.py` | Full file |
| Admin Routes | `app/routers/admin.py` | Full file |

---

## 🔌 Common API Calls

### Authentication
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "User", "email": "user@test.com", "password": "Pass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "Pass123"}'

# Use token (copy from login response)
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### TTS
```bash
# List voices
curl http://localhost:8000/api/tts/voices \
  -H "Authorization: Bearer $TOKEN"

# Generate TTS
curl -X POST http://localhost:8000/api/tts/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "model_name": "kokoro",
    "voice_id": 1
  }'

# Get waveform
curl http://localhost:8000/api/tts/audio/{audio_id}/waveform \
  -H "Authorization: Bearer $TOKEN"

# Download audio
curl http://localhost:8000/api/tts/audio/{audio_id}/download \
  -H "Authorization: Bearer $TOKEN" -o audio.wav
```

### Voice Cloning
```bash
# Clone voice
curl -X POST http://localhost:8000/api/voice-clone/generate \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=My Voice" \
  -F "text=Hello" \
  -F "file=@voice_sample.wav"

# Get history
curl http://localhost:8000/api/voice-clone/history \
  -H "Authorization: Bearer $TOKEN"

# Download clone
curl http://localhost:8000/api/voice-clone/audio/generated/{audio_id} \
  -H "Authorization: Bearer $TOKEN" -o clone.wav
```

### Voice Mixer
```bash
# Mix voices
curl -X POST http://localhost:8000/api/voice-mixer/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Mixed audio",
    "voice_one_id": 1,
    "voice_two_id": 2,
    "voice_one_weight": 0.6,
    "voice_two_weight": 0.4
  }'

# Save preset
curl -X POST http://localhost:8000/api/voice-mixer/save-preset \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Mix",
    "voice_one_id": 1,
    "voice_two_id": 2,
    "voice_one_weight": 0.6,
    "voice_two_weight": 0.4
  }'
```

---

## 🛠️ Adding New Features

### New Endpoint in Existing Router

```python
# In app/routers/tts.py

@router.post("/new-endpoint")
async def new_endpoint(
    param: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Description of endpoint"""
    try:
        # Your logic here
        return {"result": "success"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

### New Service Method

```python
# In app/services/tts_service.py

class TTSService:
    @staticmethod
    def new_method(param: str) -> dict:
        """Description"""
        # Implementation
        return {}
```

### New Database Model

```python
# In app/models/voice.py

class NewModel(Base):
    __tablename__ = "new_table"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
```

### New Pydantic Schema

```python
# In app/schemas/new_schema.py

from pydantic import BaseModel, Field

class NewRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    value: int = Field(..., gt=0, lt=100)

class NewResponse(BaseModel):
    id: int
    name: str
    value: int
```

---

## 🔍 Common Tasks

### Find all references to a function
```bash
grep -r "function_name" app/
```

### Run tests for a specific module
```bash
pytest app/tests/test_tts.py -v
```

### Reset database
```bash
docker-compose down
docker volume rm voxforge-ai_postgres_data
docker-compose up -d
python app/init_db.py
```

### View database contents
```bash
psql -h localhost -U voxforge_admin -d voxforge_db
```

### Monitor Redis
```bash
redis-cli
KEYS *
MONITOR
```

### Check active Celery tasks
```bash
celery -A app.workers.celery_app inspect active
celery -A app.workers.celery_app inspect stats
```

### Generate admin user
```bash
python -c "
from app.utils.security import hash_password
from app.models.user import User
from app.database import SessionLocal

db = SessionLocal()
admin = User(
    name='Admin',
    email='admin@test.com',
    password_hash=hash_password('password123'),
    role='admin',
    is_active=True
)
db.add(admin)
db.commit()
"
```

---

## 📊 Database Schema Quick Reference

### Users Table
```
id (PK) | name | email (unique) | password_hash | role | is_active | created_at
```

### Audio Generations Table
```
id (PK) | user_id (FK) | text | model_name | voice_id (FK) | audio_url | 
status (pending/processing/completed/failed) | error_message | created_at
```

### Cloned Voices Table
```
id (PK) | user_id (FK) | name | reference_audio_url | generated_voice_url | 
model_name | status | error_message | created_at
```

### Mixed Voices Table
```
id (PK) | user_id (FK) | name | voice_one_id (FK) | voice_two_id (FK) | 
voice_one_weight | voice_two_weight | created_at
```

### Voices Table
```
id (PK) | name | model_name | voice_type | preview_url | is_active | created_at
```

### Jobs Table
```
id (PK) | user_id (FK) | job_type (tts/voice_clone/voice_mix) | 
status | progress (0-100) | result_url | error_message | created_at | updated_at
```

---

## 🎨 React Components Map

| Component | Purpose | Status |
|-----------|---------|--------|
| `TTSView` | Text-to-speech | ✅ Ready to build |
| `CloningView` | Voice cloning | ✅ Ready to build |
| `MixerView` | Voice mixing | ⏳ Service ready |
| `HistoryView` | Audio history | 📋 Planned |
| `AdminView` | Admin dashboard | 📋 Planned |
| `DashboardView` | User dashboard | ✅ Base exists |
| `WaveformPlayer` | Audio playback | ✅ Ready to build |

---

## 🧪 Testing Patterns

### Test API Endpoint
```python
def test_tts_generate():
    client = TestClient(app)
    response = client.post(
        "/api/tts/generate",
        json={"text": "Hello", "model_name": "kokoro", "voice_id": 1},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
```

### Test Service Method
```python
def test_tts_generation():
    result = TTSService.generate_tts("Hello", "kokoro", "af_sarah")
    assert result["status"] == "completed"
    assert "audio_id" in result
    assert Path(result["file_path"]).exists()
```

### Test Database Query
```python
def test_audio_history():
    db = SessionLocal()
    audios = db.query(AudioGeneration).filter(
        AudioGeneration.user_id == 1
    ).all()
    assert len(audios) > 0
```

---

## 🚨 Debugging Tips

### Backend Errors
```bash
# Check logs
docker-compose logs -f api

# Check for syntax errors
python -m py_compile app/main.py

# Run in debug mode
uvicorn app.main:app --reload --log-level debug
```

### Database Errors
```bash
# Connect to DB
psql -h localhost -U voxforge_admin -d voxforge_db

# Check tables
\dt

# View logs
docker-compose logs db
```

### Audio Generation Issues
```python
# Test TTS manually
from app.services.tts_service import TTSService
result = TTSService.generate_tts("Test", "kokoro", "af_sarah")
print(result)

# Test validation
from app.utils.audio_validation import validate_audio_file
validate_audio_file("test.wav")
```

---

## 📦 Environment Variables

```env
# Security
SECRET_KEY=<random-string>
DEBUG=False

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis/Celery
REDIS_URL=redis://localhost:6379/0

# Files
UPLOAD_DIR=app/generated_audio
MAX_UPLOAD_SIZE=20971520

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8501

# API Keys (optional)
GEMINI_API_KEY=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

## 📈 Performance Monitoring

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/auth/me

# Check database query time
\timing
SELECT * FROM audio_generations;

# Monitor memory usage
docker stats voxforge-ai

# Profile Python code
python -m cProfile -s cumtime app/main.py
```

---

## 🔗 Important Links

- [API Docs](http://localhost:8000/docs)
- [ReDoc](http://localhost:8000/redoc)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org)
- [React Docs](https://react.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

## 📋 Checklist for Adding New Feature

- [ ] Create database model (if needed)
- [ ] Create Pydantic schema for validation
- [ ] Create service class with business logic
- [ ] Create API routes/endpoints
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Update this quick reference
- [ ] Create React UI component
- [ ] Test end-to-end
- [ ] Update README
- [ ] Commit to git

---

**Version:** 1.0  
**Last Updated:** 2026-06-23  
**Project Status:** Week 3-4 Complete ✅
