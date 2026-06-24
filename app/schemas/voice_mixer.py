"""Voice Mixer schemas"""
from pydantic import BaseModel, Field
from typing import Optional


class VoiceMixerGenerateRequest(BaseModel):
    """Voice mixer generation request"""
    text: str = Field(..., min_length=5, max_length=5000)
    voice_one_id: int
    voice_two_id: int
    voice_one_weight: float = Field(..., ge=0.0, le=1.0)
    voice_two_weight: float = Field(..., ge=0.0, le=1.0)


class VoiceMixerSavePresetRequest(BaseModel):
    """Voice mixer preset save request"""
    name: str = Field(..., min_length=2, max_length=100)
    voice_one_id: int
    voice_two_id: int
    voice_one_weight: float = Field(..., ge=0.0, le=1.0)
    voice_two_weight: float = Field(..., ge=0.0, le=1.0)


class MixedVoiceResponse(BaseModel):
    """Mixed voice response"""
    id: int
    user_id: int
    name: str
    voice_one_id: int
    voice_two_id: int
    voice_one_weight: float
    voice_two_weight: float
    audio_url: Optional[str] = None
    status: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class VoiceResponse(BaseModel):
    """Voice response for dropdown/selection"""
    id: int
    name: str
    model_name: str
    voice_type: str
    preview_url: Optional[str] = None

    class Config:
        from_attributes = True
