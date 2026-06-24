"""Text-to-Speech schemas"""
from pydantic import BaseModel, Field
from typing import Optional


class TTSGenerateRequest(BaseModel):
    """TTS generation request"""
    text: str = Field(..., min_length=5, max_length=5000)
    model_name: str = Field(..., description="Model: 'kokoro' or 'pocket_tts'")
    voice_id: int
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class AudioGenerationResponse(BaseModel):
    """Audio generation response"""
    id: int
    text: str
    model_name: str
    voice_id: int
    audio_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class AudioHistoryResponse(BaseModel):
    """Audio history list item"""
    id: int
    text: str
    model_name: str
    voice_id: int
    audio_url: Optional[str]
    status: str
    created_at: str

    class Config:
        from_attributes = True
