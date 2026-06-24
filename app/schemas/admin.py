"""Admin schemas"""
from pydantic import BaseModel, Field
from typing import Optional


class VoiceCreateRequest(BaseModel):
    """Create new voice"""
    name: str = Field(..., min_length=2, max_length=100)
    model_name: str = Field(..., description="'kokoro' or 'pocket_tts'")
    voice_type: str = Field(..., description="'male', 'female', 'neutral'")
    preview_url: Optional[str] = None


class VoiceUpdateRequest(BaseModel):
    """Update voice"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    voice_type: Optional[str] = None
    preview_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserManagementResponse(BaseModel):
    """User management response"""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: str
    generations_count: int = 0

    class Config:
        from_attributes = True


class JobStatusResponse(BaseModel):
    """Job status response"""
    id: int
    user_id: int
    job_type: str
    status: str
    progress: float
    error_message: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
