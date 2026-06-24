from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings - loaded from environment variables"""
    
    # Application
    APP_NAME: str = "VoxForge AI"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://voxforge_admin:voxforge_secure_pass_1025@localhost:5432/voxforge_db"
    
    # Redis/Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024  # 20MB
    UPLOAD_DIR: str = "app/generated_audio"
    ALLOWED_AUDIO_FORMATS: list = ["mp3", "wav", "flac"]
    
    # TTS/AI Models
    GEMINI_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8501", "http://localhost:7860"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()