from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.voice import Voice
from ..schemas.tts import (
    TTSGenerateRequest,
    TTSVoicesResponse,
    VoiceResponse,
    GenerationResultResponse,
)
from ..services.tts_service import TTSService
from ..utils.security import get_current_user

router = APIRouter()


@router.get("/voices", response_model=TTSVoicesResponse)
async def get_voices(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get all available TTS voices from the database, grouped by model.
    This ensures consistency with the generation endpoint.
    """
    voices_from_db = (
        db.query(Voice).filter(Voice.is_active == True).order_by(Voice.name).all()
    )

    grouped_voices = defaultdict(list)
    for voice in voices_from_db:
        if voice.model_name:
            grouped_voices[voice.model_name].append(
                VoiceResponse(id=voice.id, name=voice.name)
            )

    return TTSVoicesResponse(voices=grouped_voices)


@router.post(
    "/generate",
    response_model=GenerationResultResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_speech(
    request: TTSGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate speech from text using a specific voice from the database.
    """
    voice = (
        db.query(Voice)
        .filter(Voice.id == request.voice_id, Voice.is_active == True)
        .first()
    )

    if not voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice not found or inactive",
        )

    # The TTSService needs the internal voice name (e.g., 'en_us_cmu_slt'),
    # not the database ID. We use the voice object fetched from the DB.
    result = TTSService.generate_tts(
        text=request.text,
        model_name=voice.model_name,
        voice=voice.name,  # Pass the actual voice name to the service
        speed=request.speed,
        user_id=current_user.id,
        db=db,
    )

    return GenerationResultResponse(**result)

# You would also add your /history and /audio/{id} endpoints here