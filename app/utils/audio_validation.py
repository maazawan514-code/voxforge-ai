"""Audio file validation utilities"""
import os
import librosa
from fastapi import HTTPException, status
from config import get_settings

settings = get_settings()


def validate_audio_file(file_path: str) -> dict:
    """
    Validate audio file format, size, and duration
    
    Returns:
        dict: Audio metadata including duration and format
    """
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file not found"
        )
    
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed ({settings.MAX_UPLOAD_SIZE / 1024 / 1024:.0f}MB)"
        )
    
    # Get file extension
    _, ext = os.path.splitext(file_path)
    file_format = ext.lower().strip('.')
    
    if file_format not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Allowed: {', '.join(settings.ALLOWED_AUDIO_FORMATS)}"
        )
    
    # Load audio and get duration
    try:
        y, sr = librosa.load(file_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read audio file: {str(e)}"
        )
    
    # Check duration (recommended: 5-30 seconds for voice samples)
    if duration < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is too short (minimum 1 second)"
        )
    
    if duration > 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is too long (maximum 60 seconds)"
        )
    
    return {
        "file_format": file_format,
        "file_size": file_size,
        "duration": duration,
        "sample_rate": sr,
    }


def validate_text_input(text: str) -> bool:
    """Validate text input for TTS"""
    if not text or len(text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must be at least 5 characters long"
        )
    
    if len(text) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must not exceed 5000 characters"
        )
    
    return True


def validate_mixer_weights(weight_one: float, weight_two: float) -> bool:
    """Validate voice mixer weights"""
    if weight_one < 0 or weight_one > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice one weight must be between 0 and 1"
        )
    
    if weight_two < 0 or weight_two > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice two weight must be between 0 and 1"
        )
    
    # Weights should sum to approximately 1.0 (with small tolerance for floating point)
    total = weight_one + weight_two
    if abs(total - 1.0) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice weights must sum to 100% (1.0)"
        )
    
    return True
