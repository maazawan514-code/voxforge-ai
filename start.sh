#!/bin/bash
# VoxForge AI - Project startup script

set -e

echo "🎙️  VoxForge AI - Starting Services"
echo "===================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please update with your configuration."
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Start Docker Compose services
echo "🐳 Starting Docker Compose services..."
docker-compose up -d
echo "✓ Docker services started"

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Initialize database
echo "🗄️  Initializing database..."
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(bind=engine)"
echo "✓ Database initialized"

# Display startup information
echo ""
echo "✅ VoxForge AI is ready!"
echo ""
echo "📍 Services:"
echo "  • FastAPI Backend: http://localhost:8000"
echo "  • API Documentation: http://localhost:8000/docs"
echo "  • Streamlit UI: http://localhost:8501"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "🚀 To start the backend server, run:"
echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "🎨 To start the Streamlit UI, run:"
echo "   streamlit run ui/streamlit_app.py"
echo ""
echo "👷 To start Celery worker, run:"
echo "   celery -A app.workers.celery_app worker --loglevel=info"
echo ""
echo "📊 To view Docker logs:"
echo "   docker-compose logs -f"
echo ""
