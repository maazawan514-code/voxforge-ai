# VoxForge AI

AI voice generation platform — text-to-speech, voice cloning, and voice mixing.

## Project Overview

VoxForge AI lets users generate realistic speech from text, clone voices from audio samples, and blend multiple voices together with custom weights.

### Core Features

- **Text-to-Speech**: Generate speech from text using Kokoro TTS (ONNX) — working
- **Voice Cloning**: Clone a voice from a reference audio sample — currently being upgraded from a placeholder to Coqui XTTS-v2
- **Voice Mixer**: Blend multiple voices with custom percentage weights — working
- **Audio History**: Track and play back generated audio
- **User Authentication**: JWT-based registration and login

## Tech Stack

### Backend
- **Framework**: FastAPI + Uvicorn (Python 3.14)
- **Database**: Azure SQL Database (free tier)
- **TTS Engine**: Kokoro ONNX
- **Voice Cloning Engine**: Coqui XTTS-v2 (in progress; runs in a separate Python 3.11 virtual environment — see below)
- **Authentication**: JWT tokens with passlib/bcrypt (bcrypt pinned to 4.0.1)

### Frontend
- **Framework**: React + Vite (TypeScript)
- **Deployment**: Netlify (auto-deploys from `main` branch)

### Audio Processing
- **Libraries**: pydub, ffmpeg-python, librosa, soundfile, numpy

## Project Structure

```
voxforge-ai/
├── app/                          # FastAPI backend
│   ├── main.py                   # Application entry point
│   ├── init_db.py                # DB seeding script
│   ├── fix_voice_names.py        # One-off script for correcting seeded voice data
│   ├── services/
│   │   ├── tts_service.py        # TTS generation (Kokoro)
│   │   ├── voice_cloning_service.py  # Voice cloning (XTTS-v2 integration in progress)
│   │   └── audio_mixer.py        # Voice mixing
│   ├── routers/
│   │   └── voice_mixer.py        # Voice mixer endpoints
│   ├── generated_audio/          # Generated audio files (not tracked in git)
│   └── onnx/                     # Kokoro model files (model.onnx, voices.bin)
│
├── src/                           # React/Vite frontend
│   ├── utils/api.ts               # API request helper
│   ├── components/
│   │   ├── TTSView.tsx
│   │   ├── MixerView.tsx
│   │   └── WaveformPlayer.tsx
│   └── data/                      # (legacy mock data, being phased out)
│
├── xtts_env/                      # Python 3.11 virtual environment for XTTS-v2 (local only, not in git)
├── requirements.txt                # Backend Python dependencies (used for local dev / Render, not Netlify)
├── .env                            # Environment variables (never commit real values)
└── README.md
```

## Local Development Setup

### 1. Backend (FastAPI)

```powershell
# Install dependencies
pip install -r requirements.txt

# Run the backend
python -m uvicorn app.main:app --reload
```

Access API docs at: http://localhost:8000/docs

### 2. Frontend (React/Vite)

```powershell
npm install
npm run dev
```

Access UI at: http://localhost:3000 (always use `localhost:3000`, not your LAN IP — the CORS config depends on it)

### 3. Voice Cloning (XTTS-v2) — separate environment

XTTS-v2 needs its own Python 3.11 environment because it's not yet compatible with Python 3.14:

```powershell
py -3.11 -m venv xtts_env
.\xtts_env\Scripts\Activate.ps1
pip install torch torchaudio
pip install coqui-tts
pip install "transformers<5"
pip install "coqui-tts[codec]"
$env:COQUI_TOS_AGREED="1"
```

This environment is for local development/testing only — XTTS-v2 is too heavy (4-8GB RAM) for the free hosting tiers used in production.

## Database

Using **Azure SQL Database** (free tier: 100k vCore-sec/month, 32GB). To seed voices and an admin user:

```powershell
python -m app.init_db
```

Note: if your home/office IP changes, you'll need to re-add a firewall rule in the Azure Portal (SQL databases → Set server firewall → add client IP).

## Deployment

| Component | Service | Status |
|---|---|---|
| Frontend (React/Vite) | Netlify | ✅ Live at voxforgeai514.netlify.app |
| Backend (FastAPI) | Render (free tier) | ⏳ Not yet deployed |
| Database | Azure SQL (free tier) | ✅ Live |
| Redis (Celery broker) | Upstash (free tier) | ⏳ Not yet set up |
| Kokoro model files | Runtime download from GitHub release | ⏳ Startup script needed for Render (ephemeral disk) |
| XTTS-v2 (voice cloning) | Local dev only | 🚧 Mid-integration |

**Important**: `requirements.txt` lives in `app/` (not the repo root) specifically so that Netlify doesn't try to auto-install Python dependencies when building the frontend.

## Git Workflow

**Commit and push after every single fix — no exceptions.** This project was burned once by an AI coding assistant silently reverting a working file with no commit history to recover from.

```powershell
git add .
git commit -m "fix: <short description>"
git push
```

## Known Issues / In Progress

- Voice cloning still needs `app/services/voice_cloning_service.py`'s `_clone_with_pocket_tts()` rewritten to call real XTTS-v2 instead of the placeholder sine-wave tone
- Backend not yet deployed to Render
- Frontend's `VITE_API_BASE_URL` on Netlify is still a placeholder (`http://localhost:8000`) until the backend has a public URL

## Security Note

Never commit or paste `.env` contents anywhere. If credentials have been exposed accidentally, rotate them (SECRET_KEY, API keys, SMTP password, database connection string) immediately.

---

**Last Updated**: 2026-07-21
