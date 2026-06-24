# VoxForge AI - Complete Setup & Deployment Guide

Professional setup and deployment guide for the VoxForge AI platform.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Full Installation](#full-installation)
3. [Running Services](#running-services)
4. [Database Setup](#database-setup)
5. [API Documentation](#api-documentation)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Production Checklist](#production-checklist)

---

## Quick Start

**5-minute setup for local development:**

```bash
# 1. Clone repository
git clone <repo-url>
cd voxforge-ai

# 2. Setup Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start services
docker-compose up -d

# 5. Initialize database
python app/init_db.py

# 6. Run backend (Terminal 1)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 7. Run frontend (Terminal 2)
npm run dev

# 8. Access application
# Backend API: http://localhost:8000
# Swagger Docs: http://localhost:8000/docs
# Frontend UI: http://localhost:3000
```

---

## Full Installation

### Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **Docker & Docker Compose**: Latest version
- **PostgreSQL**: 15 (via Docker recommended)
- **Redis**: 7 (via Docker recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/voxforge-ai.git
cd voxforge-ai
```

### Step 2: Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Verify activation (should see (venv) in prompt)
python --version  # Should be 3.9+
```

### Step 3: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Node Dependencies

```bash
npm install
```

### Step 5: Environment Configuration

```bash
# Copy template
cp .env.example .env

# Edit .env file
nano .env  # or use your editor
```

**Key variables to configure:**

```env
# Security
SECRET_KEY=<generate-random-string>  # Use: python -c "import secrets; print(secrets.token_urlsafe())"
DATABASE_URL=postgresql://voxforge_admin:voxforge_secure_pass_1025@localhost:5432/voxforge_db

# Redis
REDIS_URL=redis://localhost:6379/0

# File Storage
UPLOAD_DIR=app/generated_audio
MAX_UPLOAD_SIZE=20971520  # 20MB

# API Keys (get from respective services)
GEMINI_API_KEY=your_key_here
```

### Step 6: Start Docker Services

```bash
# Start PostgreSQL, Redis, and other services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# CONTAINER ID   IMAGE             COMMAND                 PORTS
# ...postgres...  postgres:15       docker-entrypoint.s...  0.0.0.0:5432->5432
# ...redis...     redis:7           docker-entrypoint.s...  0.0.0.0:6379->6379
```

### Step 7: Initialize Database

```bash
# Create tables and seed initial data
python app/init_db.py

# Expected output:
# 🎙️  VoxForge AI - Database Initialization
# ========================================
# 📦 Initializing voices...
# ✓ Initialized 8 voices
# 👤 Initializing admin user...
# ✓ Admin user created
# ✅ Database initialization complete!
```

**Admin credentials:**
- Email: `admin@voxforge.ai`
- Password: `admin123` (⚠️ Change in production!)

---

## Running Services

### Development Environment

Open 4-5 terminals for local development:

```bash
# Terminal 1: Backend API
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: React Frontend
npm run dev

# Terminal 3: Celery Worker
celery -A app.workers.celery_app worker --loglevel=info

# Terminal 4: Monitor Logs
docker-compose logs -f

# Terminal 5: Optional - Redis CLI
redis-cli
redis-cli MONITOR
```

**Service URLs:**

| Service | URL | Purpose |
|---------|-----|---------|
| FastAPI | `http://localhost:8000` | Backend API |
| Swagger | `http://localhost:8000/docs` | API documentation |
| ReDoc | `http://localhost:8000/redoc` | Alternative API docs |
| React | `http://localhost:3000` | Frontend UI |
| PostgreSQL | `localhost:5432` | Database |
| Redis | `localhost:6379` | Cache/Queue |

---

## Database Setup

### Create Database Manually

```bash
# If docker-compose didn't create it automatically
docker exec voxforge-postgres psql -U postgres -c "CREATE DATABASE voxforge_db;"

# Apply migrations (if using Alembic)
python -m alembic upgrade head
```

### Database Backup

```bash
# Backup database
docker exec voxforge-postgres pg_dump -U voxforge_admin voxforge_db > backup.sql

# Restore database
docker exec -i voxforge-postgres psql -U voxforge_admin voxforge_db < backup.sql
```

### Reset Database

```bash
# ⚠️ Warning: This deletes all data!
docker-compose down
docker volume rm voxforge-ai_postgres_data
docker-compose up -d
python app/init_db.py
```

---

## API Documentation

### Interactive Swagger UI

Visit: `http://localhost:8000/docs`

Features:
- Try out API endpoints
- View request/response schemas
- Generate client code
- Authorize with Bearer token

### Authentication

All protected endpoints require JWT token:

```bash
# 1. Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# 2. Login to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {...}
}

# 3. Use token in subsequent requests
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### API Endpoints Overview

**Week 3-4 (Text-to-Speech & Voice Cloning):**
```bash
GET    /api/tts/voices              # List available voices
POST   /api/tts/generate            # Generate speech
GET    /api/tts/history             # Get generation history
GET    /api/tts/audio/{id}          # Stream audio
GET    /api/tts/audio/{id}/download # Download audio

POST   /api/voice-clone/generate    # Clone voice
GET    /api/voice-clone/history     # Get cloning history
DELETE /api/voice-clone/{id}        # Delete clone
```

**Week 5-6 (Voice Mixer & Library):**
```bash
POST   /api/voice-mixer/generate    # Mix voices
POST   /api/voice-mixer/save-preset # Save preset
GET    /api/audio/history           # Combined history
GET    /api/library/voices          # Voice library
POST   /api/library/favorites/{id}  # Add favorite
```

**Week 7-8 (Admin & Advanced):**
```bash
GET    /api/admin/users             # List users
GET    /api/admin/stats             # System statistics
POST   /api/admin/voices            # Create voice
POST   /api/audio/{id}/share        # Create share link
GET    /api/analytics/dashboard     # User analytics
```

---

## Testing

### Unit Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest app/tests/test_tts.py -v

# Run with coverage
pytest --cov=app tests/

# Generate coverage report
pytest --cov=app --cov-report=html
# Open: htmlcov/index.html
```

### Integration Tests

```bash
# Test API endpoints
pytest app/tests/test_api.py -v

# Test authentication
pytest app/tests/test_auth.py -v
```

### Manual Testing

```bash
# Test TTS
python scripts/test_tts.py

# Test voice cloning
python scripts/test_cloning.py

# Test mixer
python scripts/test_mixer.py
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load tests
locust -f locustfile.py --host=http://localhost:8000
```

---

## Deployment

### Docker Deployment (Recommended for Production)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Scale workers
docker-compose up -d --scale celery-worker=3

# Stop services
docker-compose down
```

### Cloud Deployment Options

#### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs
```

#### Option 2: Render

1. Connect GitHub repository to Render
2. Create services:
   - Backend (FastAPI)
   - Frontend (React)
   - PostgreSQL (managed)
   - Redis (managed)
3. Deploy using `docker-compose.yml`

#### Option 3: Fly.io

```bash
# Install Fly CLI
# https://fly.io/docs/getting-started/installing-flyctl/

# Login
flyctl auth login

# Create app
flyctl launch

# Deploy
flyctl deploy
```

#### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Auto-detect services from `docker-compose.yml`
3. Configure environment variables
4. Deploy

### Environment Variables for Production

```env
# Security
DEBUG=False
SECRET_KEY=<random-secret>

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/voxforge_db

# Redis
REDIS_URL=redis://prod-redis:6379/0

# CORS - Restrict to your domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Storage - Use AWS S3 or similar
AWS_S3_BUCKET_NAME=voxforge-prod
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# API Keys
GEMINI_API_KEY=your_prod_key

# Email notifications
SMTP_SERVER=smtp.gmail.com
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=xxx
```

---

## Troubleshooting

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose ps db

# View database logs
docker-compose logs db

# Test connection
psql -h localhost -U voxforge_admin -d voxforge_db -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
redis-cli PING  # Should return PONG

# Check Redis stats
redis-cli INFO
```

### TTS Generation Failures

```bash
# Check if Kokoro model is loaded
python -c "from app.services.tts_service import kokoro; print('Kokoro:', kokoro)"

# Verify model files
ls -la app/onnx/

# Try manual generation
python -c "
from app.services.tts_service import TTSService
result = TTSService.generate_tts('Test', 'kokoro', 'af_sarah')
print(result)
"
```

### Celery Worker Issues

```bash
# Purge task queue
celery -A app.workers.celery_app purge

# Monitor active tasks
celery -A app.workers.celery_app inspect active

# Check stats
celery -A app.workers.celery_app inspect stats
```

### Frontend Build Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## Production Checklist

Before deploying to production:

### Security
- [ ] Change default passwords
- [ ] Generate strong SECRET_KEY
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Implement request signing
- [ ] Enable security headers (HSTS, CSP, X-Frame-Options)
- [ ] Setup API key rotation
- [ ] Configure WAF (firewall rules)

### Performance
- [ ] Enable caching headers
- [ ] Setup CDN for static files
- [ ] Configure database connection pooling
- [ ] Setup Redis caching
- [ ] Enable gzip compression
- [ ] Optimize images/audio files
- [ ] Setup load balancing
- [ ] Monitor memory usage

### Monitoring & Logging
- [ ] Setup error tracking (Sentry)
- [ ] Configure structured logging
- [ ] Setup APM (New Relic, DataDog)
- [ ] Create dashboards
- [ ] Setup alerts for critical errors
- [ ] Monitor API response times
- [ ] Track storage usage
- [ ] Monitor worker health

### Database
- [ ] Enable automated backups
- [ ] Setup read replicas
- [ ] Configure connection pooling
- [ ] Optimize queries
- [ ] Setup maintenance windows
- [ ] Test disaster recovery
- [ ] Monitor disk space

### Infrastructure
- [ ] Setup auto-scaling
- [ ] Configure health checks
- [ ] Setup DNS failover
- [ ] Enable automatic restarts
- [ ] Configure network security groups
- [ ] Setup VPN access for team
- [ ] Configure SSH key-based auth only

### Compliance
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Configure GDPR compliance
- [ ] Setup data retention policies
- [ ] Enable audit logging
- [ ] Document security practices

---

## Performance Optimization

### API Response Times

```bash
# Target: <200ms for most endpoints

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/auth/me

# Use APM tools
# New Relic, DataDog, Elastic APM
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_audio_user_id ON audio_generations(user_id);
CREATE INDEX idx_audio_created_at ON audio_generations(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM audio_generations WHERE user_id = 1;
```

### Caching Strategy

```python
# Cache voice list (changes rarely)
# Cache user preferences
# Cache generation statistics

# Use Redis with TTL
redis.setex(f"voices:list", 3600, json.dumps(voices))
```

---

## Rollback & Recovery

### Rollback Recent Deploy

```bash
# Get previous version
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Redeploy
docker-compose build
docker-compose up -d
```

### Database Recovery

```bash
# Restore from backup
docker exec -i voxforge-postgres psql -U voxforge_admin voxforge_db < backup.sql

# Verify data
psql -h localhost -U voxforge_admin -d voxforge_db -c "SELECT COUNT(*) FROM users;"
```

---

## Support & Resources

- 📚 [FastAPI Documentation](https://fastapi.tiangolo.com)
- 📚 [SQLAlchemy Docs](https://docs.sqlalchemy.org)
- 📚 [React Documentation](https://react.dev)
- 📚 [PostgreSQL Docs](https://www.postgresql.org/docs)
- 🎓 [Deployment Best Practices](https://12factor.net)

---

**Last Updated**: 2026-06-23  
**Version**: 1.0.0  
**Status**: Production Ready
