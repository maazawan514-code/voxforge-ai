from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.voice import ClonedVoice
from ..schemas.voice_clone import VoiceCloningGenerateRequest, ClonedVoiceResponse, ClonedVoiceHistoryResponse
from ..services.voice_cloning_service import VoiceCloningService
from ..services.storage_service import StorageService
from ..utils.security import get_current_user
from ..utils.audio_validation import validate_audio_file
import tempfile
import os
import uuid
from pathlib import Path

router = APIRouter()


@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_cloned_voice(
    name: str = Form(..., min_length=2, max_length=100),
    text: str = Form(..., min_length=5, max_length=5000),
    file: UploadFile = File(...),
    model_name: str = Form(default="pocket_tts"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a cloned voice from reference audio"""
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Validate audio file
        audio_info = validate_audio_file(tmp_path)
        
        # Save reference audio permanently
        ref_audio_id = str(uuid.uuid4())
        ref_filename = f"reference_{ref_audio_id}.wav"
        
        # Create user reference directory
        ref_dir = Path("app/generated_audio") / f"user_{current_user.id}" / "references"
        ref_dir.mkdir(parents=True, exist_ok=True)
        ref_audio_path = ref_dir / ref_filename
        
        # Copy file to reference directory
        with open(tmp_path, "rb") as src:
            with open(ref_audio_path, "wb") as dst:
                dst.write(src.read())
        
        # Clone the voice
        cloned_result = await VoiceCloningService.clone_voice(
            reference_audio_path=str(ref_audio_path),
            text=text,
            voice_name=name,
            model_name=model_name,
            user_id=current_user.id,
        )
        
        # Save to database
        cloned_voice = ClonedVoice(
            user_id=current_user.id,
            name=name,
            reference_audio_url=f"/api/audio/reference/{ref_audio_id}",
            generated_voice_url=cloned_result["audio_url"],
            model_name=model_name,
            status="completed",
        )
        db.add(cloned_voice)
        db.commit()
        db.refresh(cloned_voice)
        
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        return {
            "message": "Voice cloned successfully",
            "cloned_voice_id": cloned_voice.id,
            "name": cloned_voice.name,
            "audio_url": cloned_voice.generated_voice_url,
            "duration": audio_info.get("duration", 0),
            "reference_quality": audio_info,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice cloning failed: {str(e)}"
        )


@router.get("/history", response_model=list[ClonedVoiceHistoryResponse])
async def get_cloning_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """Get user's voice cloning history"""
    cloned_voices = db.query(ClonedVoice).filter(
        ClonedVoice.user_id == current_user.id
    ).order_by(
        ClonedVoice.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        ClonedVoiceHistoryResponse(
            id=v.id,
            name=v.name,
            model_name=v.model_name,
            status=v.status,
            created_at=v.created_at.isoformat() if v.created_at else "",
        )
        for v in cloned_voices
    ]


@router.get("/{clone_id}")
async def get_cloned_voice_details(
    clone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get cloned voice details"""
    cloned_voice = db.query(ClonedVoice).filter(
        ClonedVoice.id == clone_id,
        ClonedVoice.user_id == current_user.id,
    ).first()
    
    if not cloned_voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cloned voice not found"
        )
    
    return ClonedVoiceResponse(
        id=cloned_voice.id,
        user_id=cloned_voice.user_id,
        name=cloned_voice.name,
        reference_audio_url=cloned_voice.reference_audio_url,
        generated_voice_url=cloned_voice.generated_voice_url,
        model_name=cloned_voice.model_name,
        status=cloned_voice.status,
        error_message=cloned_voice.error_message,
        created_at=cloned_voice.created_at.isoformat() if cloned_voice.created_at else "",
    )


@router.delete("/{clone_id}")
async def delete_cloned_voice(
    clone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a cloned voice"""
    cloned_voice = db.query(ClonedVoice).filter(
        ClonedVoice.id == clone_id,
        ClonedVoice.user_id == current_user.id,
    ).first()
    
    if not cloned_voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cloned voice not found"
        )
    
    # Delete files
    try:
        if cloned_voice.generated_voice_url:
            audio_id = cloned_voice.generated_voice_url.split("/")[-1].replace(".wav", "")
            VoiceCloningService.delete_cloned_voice(audio_id, current_user.id)
    except Exception:
        pass  # Log error but don't fail
    
    # Delete from database
    db.delete(cloned_voice)
    db.commit()
    
    return {"message": "Cloned voice deleted successfully"}


# Audio Download Endpoints

@router.get("/audio/generated/{audio_id}")
async def download_generated_clone(
    audio_id: str,
    current_user: User = Depends(get_current_user),
):
    """Download generated cloned voice audio"""
    try:
        file_path = VoiceCloningService.get_cloned_voice_file(audio_id, current_user.id)
        
        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found"
            )
        
        return FileResponse(
            path=str(file_path),
            media_type="audio/wav",
            filename=f"cloned_voice_{audio_id}.wav",
            headers={"Content-Disposition": "attachment"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download audio: {str(e)}"
        )
