from functools import lru_cache
import json

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    # -------------------------------------------------
    # Application
    # -------------------------------------------------

    APP_NAME: str = "VoxForge AI"
    DEBUG: bool = False

    # -------------------------------------------------
    # Database
    # -------------------------------------------------

    DATABASE_URL: str

    # -------------------------------------------------
    # Redis
    # -------------------------------------------------

    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # -------------------------------------------------
    # Authentication
    # -------------------------------------------------

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    COOKIE_NAME: str = "voxforge_session"
    REFRESH_COOKIE_NAME: str = "voxforge_refresh"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None

    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    TEMP_PASSWORD_LENGTH: int = 12

    # -------------------------------------------------
    # SMTP
    # -------------------------------------------------

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@voxforge.ai"
    SMTP_FROM_NAME: str = "VoxForge AI"
    SMTP_USE_TLS: bool = True

    # -------------------------------------------------
    # Uploads
    # -------------------------------------------------

    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024
    UPLOAD_DIR: str = "app/generated_audio"

    ALLOWED_AUDIO_FORMATS: list[str] = Field(
        default=["mp3", "wav", "flac"]
    )

    # -------------------------------------------------
    # AI
    # -------------------------------------------------

    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # -------------------------------------------------
    # Frontend
    # -------------------------------------------------

    FRONTEND_URL: str = "http://localhost:3000"

    CORS_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8501",
            "http://localhost:7860",
        ]
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        """Parse CORS_ORIGINS from .env if it's a JSON string"""
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
        if isinstance(value, list):
            return value
        return []


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()