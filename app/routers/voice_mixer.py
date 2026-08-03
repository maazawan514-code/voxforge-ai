from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.voice import MixedVoice, Voice, AudioGeneration
from ..schemas.voice_mixer import (
    VoiceMixerGenerateRequest,
    VoiceMixerSavePresetRequest,
    MixedVoiceResponse,
    VoiceResponse,
)
from ..services.audio_mixer import AudioMixerService
from ..utils.security import get_current_user
from ..utils.audio_validation import validate_mixer_weights, validate_text_input

router = APIRouter()


@router.get("/voices", response_model=list[VoiceResponse])
async def get_available_voices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of available voices for mixing"""
    voices = db.query(Voice).filter(Voice.is_active == True).all()
    
    return [
        VoiceResponse(
            id=v.id,
            name=v.name,
            model_name=v.model_name,
            voice_type=v.voice_type,
            preview_url=v.preview_url,
        )
        for v in voices
    ]


@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_mixed_voice(
    request: VoiceMixerGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a mixed voice from two voices"""
    
    # Validate text
    validate_text_input(request.text)
    
    # Validate weights
    validate_mixer_weights(request.voice_one_weight, request.voice_two_weight)
    
    # Check if both voices exist
    voice_one = db.query(Voice).filter(
        Voice.id == request.voice_one_id,
        Voice.is_active == True
    ).first()
    voice_two = db.query(Voice).filter(
        Voice.id == request.voice_two_id,
        Voice.is_active == True
    ).first()
    
    if not voice_one or not voice_two:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both voices not found"
        )
    
    try:
        # For demo, we'll generate audio for each voice and then mix them
        # In production, this would use pre-generated or cached voice samples
        
        # Get or generate audio for voice one
        audio_one_path = await _get_voice_audio_sample(voice_one)
        audio_two_path = await _get_voice_audio_sample(voice_two)
        
        # Mix the voices
        mixed_result = await AudioMixerService.mix_voices(
            audio_one_path=audio_one_path,
            audio_two_path=audio_two_path,
            weight_one=request.voice_one_weight,
            weight_two=request.voice_two_weight,
        )
        
        return {
            "message": "Voices mixed successfully",
            "audio_url": mixed_result["audio_url"],
            "audio_id": mixed_result["audio_id"],
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice mixing failed: {str(e)}"
        )


@router.post("/save-preset", response_model=MixedVoiceResponse, status_code=status.HTTP_201_CREATED)
async def save_mixed_voice_preset(
    request: VoiceMixerSavePresetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a voice mixing preset"""
    
    # Validate weights
    validate_mixer_weights(request.voice_one_weight, request.voice_two_weight)
    
    # Check if both voices exist
    voice_one = db.query(Voice).filter(Voice.id == request.voice_one_id).first()
    voice_two = db.query(Voice).filter(Voice.id == request.voice_two_id).first()
    
    if not voice_one or not voice_two:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both voices not found"
        )
    
    # Create mixed voice preset
    mixed_voice = MixedVoice(
        user_id=current_user.id,
        name=request.name,
        voice_one_id=request.voice_one_id,
        voice_two_id=request.voice_two_id,
        voice_one_weight=request.voice_one_weight,
        voice_two_weight=request.voice_two_weight,
    )
    
    db.add(mixed_voice)
    db.commit()
    db.refresh(mixed_voice)
    
    return MixedVoiceResponse(
        id=mixed_voice.id,
        user_id=mixed_voice.user_id,
        name=mixed_voice.name,
        voice_one_id=mixed_voice.voice_one_id,
        voice_two_id=mixed_voice.voice_two_id,
        voice_one_weight=mixed_voice.voice_one_weight,
        voice_two_weight=mixed_voice.voice_two_weight,
        created_at=mixed_voice.created_at.isoformat() if mixed_voice.created_at else "",
    )


@router.get("/history", response_model=list[MixedVoiceResponse])
async def get_mixed_voices_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """Get user's saved mixed voice presets"""
    mixed_voices = db.query(MixedVoice).filter(
        MixedVoice.user_id == current_user.id
    ).order_by(
        MixedVoice.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        MixedVoiceResponse(
            id=v.id,
            user_id=v.user_id,
            name=v.name,
            voice_one_id=v.voice_one_id,
            voice_two_id=v.voice_two_id,
            voice_one_weight=v.voice_one_weight,
            voice_two_weight=v.voice_two_weight,
            created_at=v.created_at.isoformat() if v.created_at else "",
        )
        for v in mixed_voices
    ]


# Helper functions

async def _get_voice_audio_sample(voice: Voice) -> str:
    """Get or generate audio sample for a voice"""
    # In production, this would return a pre-generated sample or cache
    # For now, return a placeholder path
    return f"app/generated_audio/sample_{voice.id}.wav"
