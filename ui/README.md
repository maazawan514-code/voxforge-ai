# VoxForge AI UI

Streamlit-based web interface for VoxForge AI platform.

## Running the UI

```bash
# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run Streamlit app
streamlit run ui/streamlit_app.py
```

The UI will be available at `http://localhost:8501`

## Features

- **Landing Page**: Project overview and getting started
- **Authentication**: User registration and login
- **Dashboard**: Usage statistics and quick actions
- **Text-to-Speech**: Generate speech from text
- **Voice Cloning**: Clone voices from audio samples
- **Voice Mixer**: Blend multiple voices
- **History**: Track all generations
- **Profile**: User account management
- **Admin Panel**: System administration (admin users only)

## Configuration

Set the API_URL environment variable to point to your FastAPI backend:

```bash
export API_URL=http://localhost:8000/api
```
