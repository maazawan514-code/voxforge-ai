"""Voice Cloning schemas"""
from pydantic import BaseModel, Field
from typing import Optional


class VoiceCloningGenerateRequest(BaseModel):
    """Voice cloning generation request"""
    name: str = Field(..., min_length=2, max_length=100)
    text: str = Field(..., min_length=5, max_length=5000)
    model_name: str = Field(default="pocket_tts", description="Cloning model")


class ClonedVoiceResponse(BaseModel):
    """Cloned voice response"""
    id: int
    user_id: int
    name: str
    reference_audio_url: str
    generated_voice_url: Optional[str] = None
    model_name: str
    status: str
    error_message: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class ClonedVoiceHistoryResponse(BaseModel):
    """Cloned voice history item"""
    id: int
    name: str
    model_name: str
    status: str
    created_at: str

    class Config:
        from_attributes = True
