from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import os
from ..database import get_db
from ..models.user import User
from ..models.voice import AudioGeneration, Voice
from ..schemas.tts import TTSGenerateRequest, AudioGenerationResponse, AudioHistoryResponse
from ..services.tts_service import TTSService
from ..utils.security import get_current_user
from ..utils.audio_validation import validate_text_input

router = APIRouter()


@router.get("/voices")
async def get_available_voices(
    model_name: str = None,
    current_user: User = Depends(get_current_user),
):
    """Get available voices for TTS generation"""
    voices = TTSService.get_available_voices(model_name)
    return {"voices": voices}


@router.post("/generate", response_model=AudioGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_tts(
    request: TTSGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate text-to-speech audio"""
    # Validate text
    validate_text_input(request.text)
    
    # Check if voice exists
    voice = db.query(Voice).filter(
        Voice.id == request.voice_id,
        Voice.is_active == True
    ).first()
    if not voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice not found or inactive"
        )
    
    try:
        # Generate audio using service
        result = TTSService.generate_tts(
            text=request.text,
            model_name=request.model_name,
            voice=voice.name,
            speed=request.speed,
            user_id=current_user.id,
        )
        
        # Save to database
        audio_generation = AudioGeneration(
            user_id=current_user.id,
            text=request.text,
            model_name=request.model_name,
            voice_id=request.voice_id,
            audio_url=result["audio_url"],
            status="completed",
        )
        db.add(audio_generation)
        db.commit()
        db.refresh(audio_generation)
        
        return AudioGenerationResponse(
            id=audio_generation.id,
            text=audio_generation.text,
            model_name=audio_generation.model_name,
            voice_id=audio_generation.voice_id,
            audio_url=audio_generation.audio_url,
            status=audio_generation.status,
            error_message=audio_generation.error_message,
            created_at=audio_generation.created_at.isoformat() if audio_generation.created_at else "",
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TTS generation failed: {str(e)}"
        )


@router.get("/history", response_model=list[AudioHistoryResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """Get user's TTS generation history"""
    generations = db.query(AudioGeneration).filter(
        AudioGeneration.user_id == current_user.id
    ).order_by(
        AudioGeneration.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        AudioHistoryResponse(
            id=g.id,
            text=g.text,
            model_name=g.model_name,
            voice_id=g.voice_id,
            audio_url=g.audio_url,
            status=g.status,
            created_at=g.created_at.isoformat() if g.created_at else "",
        )
        for g in generations
    ]


@router.get("/{generation_id}", response_model=AudioGenerationResponse)
async def get_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get specific audio generation"""
    generation = db.query(AudioGeneration).filter(
        AudioGeneration.id == generation_id,
        AudioGeneration.user_id == current_user.id,
    ).first()
    
    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio generation not found"
        )
    
    return AudioGenerationResponse(
        id=generation.id,
        text=generation.text,
        model_name=generation.model_name,
        voice_id=generation.voice_id,
        audio_url=generation.audio_url,
        status=generation.status,
        error_message=generation.error_message,
        created_at=generation.created_at.isoformat() if generation.created_at else "",
    )


@router.delete("/{generation_id}")
async def delete_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete audio generation"""
    generation = db.query(AudioGeneration).filter(
        AudioGeneration.id == generation_id,
        AudioGeneration.user_id == current_user.id,
    ).first()
    
    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio generation not found"
        )
    
    # Delete file
    if generation.audio_url:
        try:
            audio_id = generation.audio_url.split("/")[-1].replace(".wav", "")
            TTSService.delete_audio(audio_id, current_user.id)
        except Exception:
            pass  # Log error but don't fail
    
    # Delete from database
    db.delete(generation)
    db.commit()
    
    return {"message": "Audio generation deleted successfully"}


# Audio Playback & Download Endpoints

@router.get("/audio/{audio_id}")
async def stream_audio(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Stream audio file for playback in browser"""
    try:
        file_path = TTSService.get_audio_file(audio_id, current_user.id)
        
        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found"
            )
        
        return FileResponse(
            path=str(file_path),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream audio: {str(e)}"
        )


@router.get("/audio/{audio_id}/download")
async def download_audio(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Download audio file"""
    try:
        file_path = TTSService.get_audio_file(audio_id, current_user.id)
        
        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found"
            )
        
        return FileResponse(
            path=str(file_path),
            media_type="audio/wav",
            filename=f"voxforge_audio_{audio_id}.wav",
            headers={"Content-Disposition": "attachment"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download audio: {str(e)}"
        )


@router.get("/audio/{audio_id}/waveform")
async def get_audio_waveform(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get waveform data for audio visualization"""
    try:
        file_path = TTSService.get_audio_file(audio_id, current_user.id)
        
        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found"
            )
        
        waveform_data = TTSService.get_audio_waveform(str(file_path))
        return waveform_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get waveform: {str(e)}"
        )