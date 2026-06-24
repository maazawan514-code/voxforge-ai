# Schemas package
from .auth import UserRegister, UserLogin, UserResponse, TokenResponse, PasswordChange
from .tts import TTSGenerateRequest, AudioGenerationResponse, AudioHistoryResponse
from .voice_clone import VoiceCloningGenerateRequest, ClonedVoiceResponse, ClonedVoiceHistoryResponse
from .voice_mixer import (
    VoiceMixerGenerateRequest,
    VoiceMixerSavePresetRequest,
    MixedVoiceResponse,
    VoiceResponse,
)
from .admin import VoiceCreateRequest, VoiceUpdateRequest, UserManagementResponse, JobStatusResponse

__all__ = [
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "PasswordChange",
    "TTSGenerateRequest",
    "AudioGenerationResponse",
    "AudioHistoryResponse",
    "VoiceCloningGenerateRequest",
    "ClonedVoiceResponse",
    "ClonedVoiceHistoryResponse",
    "VoiceMixerGenerateRequest",
    "VoiceMixerSavePresetRequest",
    "MixedVoiceResponse",
    "VoiceResponse",
    "VoiceCreateRequest",
    "VoiceUpdateRequest",
    "UserManagementResponse",
    "JobStatusResponse",
]
