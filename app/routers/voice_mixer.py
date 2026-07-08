"""Voice Mixer router — percentage sliders → decimal weights → real pydub mixing"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
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
from ..services.tts_service import TTSService
from ..utils.security import get_current_user
from ..utils.audio_validation import validate_mixer_weights, validate_text_input

router = APIRouter()


# ---------------------------------------------------------------------------
# Voice listing
# ---------------------------------------------------------------------------

@router.get("/voices", response_model=list[VoiceResponse])
async def get_available_voices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all active voices available for mixing."""
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


# ---------------------------------------------------------------------------
# Generate mixed voice
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_mixed_voice(
    request: VoiceMixerGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mix two voices.

    Frontend sends weights as 0-100 integers (slider values).
    We accept them as floats 0-1 in the schema; conversion happens in the
    frontend before sending OR we normalise here for safety.
    """
    validate_text_input(request.text)

    # Normalise weights — schema already validates ge=0 le=1, but guard anyway
    w1 = float(request.voice_one_weight)
    w2 = float(request.voice_two_weight)
    total = w1 + w2
    if total <= 0:
        raise HTTPException(status_code=400, detail="Weights must sum to a positive value.")
    w1, w2 = w1 / total, w2 / total

    voice_one = db.query(Voice).filter(Voice.id == request.voice_one_id, Voice.is_active == True).first()
    voice_two = db.query(Voice).filter(Voice.id == request.voice_two_id, Voice.is_active == True).first()

    if not voice_one or not voice_two:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both voices not found.")

    try:
        # Generate real audio samples for each voice, then mix them
        audio_one_path = await _get_or_generate_voice_sample(voice_one, request.text, current_user.id)
        audio_two_path = await _get_or_generate_voice_sample(voice_two, request.text, current_user.id)

        mixed_result = await AudioMixerService.mix_voices(
            audio_one_path=audio_one_path,
            audio_two_path=audio_two_path,
            weight_one=w1,
            weight_two=w2,
            user_id=current_user.id,
        )

        return {
            "message": "Voices mixed successfully",
            "audio_url": mixed_result["audio_url"],
            "audio_id": mixed_result["audio_id"],
            "download_url": mixed_result["download_url"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice mixing failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Save preset
# ---------------------------------------------------------------------------

@router.post("/save-preset", response_model=MixedVoiceResponse, status_code=status.HTTP_201_CREATED)
async def save_mixed_voice_preset(
    request: VoiceMixerSavePresetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a voice mixing preset without generating audio."""
    w1 = float(request.voice_one_weight)
    w2 = float(request.voice_two_weight)
    total = w1 + w2
    if total <= 0:
        raise HTTPException(status_code=400, detail="Weights must be positive.")
    w1, w2 = w1 / total, w2 / total

    validate_mixer_weights(w1, w2)

    voice_one = db.query(Voice).filter(Voice.id == request.voice_one_id).first()
    voice_two = db.query(Voice).filter(Voice.id == request.voice_two_id).first()

    if not voice_one or not voice_two:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both voices not found.")

    mixed_voice = MixedVoice(
        user_id=current_user.id,
        name=request.name,
        voice_one_id=request.voice_one_id,
        voice_two_id=request.voice_two_id,
        voice_one_weight=w1,
        voice_two_weight=w2,
        status="preset",
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
        audio_url=mixed_voice.audio_url,
        status=mixed_voice.status,
        created_at=mixed_voice.created_at.isoformat() if mixed_voice.created_at else "",
    )


# ---------------------------------------------------------------------------
# History / saved presets
# ---------------------------------------------------------------------------

@router.get("/history", response_model=list[MixedVoiceResponse])
async def get_mixed_voices_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """Get the current user's saved mixed voice presets."""
    mixed_voices = (
        db.query(MixedVoice)
        .filter(MixedVoice.user_id == current_user.id)
        .order_by(MixedVoice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        MixedVoiceResponse(
            id=v.id,
            user_id=v.user_id,
            name=v.name,
            voice_one_id=v.voice_one_id,
            voice_two_id=v.voice_two_id,
            voice_one_weight=v.voice_one_weight,
            voice_two_weight=v.voice_two_weight,
            audio_url=v.audio_url,
            status=v.status,
            created_at=v.created_at.isoformat() if v.created_at else "",
        )
        for v in mixed_voices
    ]


@router.delete("/{preset_id}")
async def delete_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a saved mixed voice preset and its audio file."""
    preset = db.query(MixedVoice).filter(
        MixedVoice.id == preset_id,
        MixedVoice.user_id == current_user.id,
    ).first()

    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found.")

    if preset.audio_url:
        try:
            audio_id = preset.audio_url.rstrip("/").split("/")[-1].replace(".wav", "")
            AudioMixerService.delete_mixed_audio(audio_id, current_user.id)
        except Exception:
            pass  # log but don't fail

    db.delete(preset)
    db.commit()
    return {"message": "Preset deleted successfully."}


# ---------------------------------------------------------------------------
# Audio download endpoints
# ---------------------------------------------------------------------------

@router.get("/audio/{audio_id}")
async def stream_mixed_audio(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Stream mixed audio for in-browser playback."""
    file_path = AudioMixerService.get_mixed_audio_file(audio_id, current_user.id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found.")
    return FileResponse(path=str(file_path), media_type="audio/wav", headers={"Content-Disposition": "inline"})


@router.get("/audio/{audio_id}/download")
async def download_mixed_audio(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Download mixed audio as a WAV file."""
    file_path = AudioMixerService.get_mixed_audio_file(audio_id, current_user.id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found.")
    return FileResponse(
        path=str(file_path),
        media_type="audio/wav",
        filename=f"voxforge_mixed_{audio_id}.wav",
        headers={"Content-Disposition": "attachment"},
    )


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

async def _get_or_generate_voice_sample(voice: Voice, text: str, user_id: int) -> str:
    """
    Generate a real TTS audio sample for a voice using TTSService.
    Falls back to an existing preview file if TTS generation fails.
    """
    try:
        result = TTSService.generate_tts(
            text=text,
            model_name=voice.model_name,
            voice=voice.name,
            speed=1.0,
            user_id=user_id,
        )
        return result["file_path"]
    except Exception:
        # If TTS fails and a preview exists, use it
        if voice.preview_url:
            from pathlib import Path
            preview_path = Path(voice.preview_url.lstrip("/"))
            if preview_path.exists():
                return str(preview_path)
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate audio sample for voice '{voice.name}'.",
        )