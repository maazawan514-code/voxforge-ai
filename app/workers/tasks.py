"""Celery task definitions"""
import os
from pathlib import Path

from celery import shared_task
from sqlalchemy.orm import Session
from ..database import SessionLocal, get_db
from ..models.voice import AudioGeneration, ClonedVoice, Job
from ..services.tts_service import TTSService
from ..services.voice_cloning_service import VoiceCloningService
from ..services.audio_mixer import AudioMixerService


@shared_task(bind=True, name="app.workers.tasks.generate_tts_task")
def generate_tts_task(self, generation_id: int, text: str, voice_id: int, model_name: str, speed: float = 1.0):
    """Background task for TTS generation"""
    db = SessionLocal()
    try:
        # Update job status to processing
        generation = db.query(AudioGeneration).filter(AudioGeneration.id == generation_id).first()
        if not generation:
            return {"status": "error", "message": "Generation not found"}
        
        generation.status = "processing"
        db.commit()
        
        # Generate TTS
        result = TTSService.generate_tts(
            text=text,
            model_name=model_name,
            voice=f"voice_{voice_id}",
            speed=speed,
        )
        
        # Update generation record
        generation.audio_url = result["audio_url"]
        generation.status = "completed"
        db.commit()
        
        return {
            "status": "success",
            "generation_id": generation_id,
            "audio_url": result["audio_url"]
        }
    
    except Exception as e:
        generation = db.query(AudioGeneration).filter(AudioGeneration.id == generation_id).first()
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
        
        return {"status": "error", "message": str(e)}
    
    finally:
        db.close()


@shared_task(bind=True, name="app.workers.tasks.clone_voice_task")
async def clone_voice_task(self, clone_id: int, reference_audio_path: str, text: str, voice_name: str, model_name: str = "pocket_tts"):
    """Background task for voice cloning"""
    db = SessionLocal()
    try:
        # Update clone status
        cloned_voice = db.query(ClonedVoice).filter(ClonedVoice.id == clone_id).first()
        if not cloned_voice:
            return {"status": "error", "message": "Clone not found"}
        
        cloned_voice.status = "processing"
        db.commit()
        
        # Clone voice
        result = await VoiceCloningService.clone_voice(
            reference_audio_path=reference_audio_path,
            text=text,
            voice_name=voice_name,
            model_name=model_name,
        )
        
        # Update clone record
        cloned_voice.generated_voice_url = result["audio_url"]
        cloned_voice.status = "completed"
        db.commit()
        
        return {
            "status": "success",
            "clone_id": clone_id,
            "audio_url": result["audio_url"]
        }
    
    except Exception as e:
        cloned_voice = db.query(ClonedVoice).filter(ClonedVoice.id == clone_id).first()
        if cloned_voice:
            cloned_voice.status = "failed"
            cloned_voice.error_message = str(e)
            db.commit()
        
        return {"status": "error", "message": str(e)}
    
    finally:
        db.close()


@shared_task(bind=True, name="app.workers.tasks.mix_voices_task")
async def mix_voices_task(self, audio_one_path: str, audio_two_path: str, weight_one: float, weight_two: float):
    """Background task for voice mixing"""
    try:
        # Mix voices
        result = await AudioMixerService.mix_voices(
            audio_one_path=audio_one_path,
            audio_two_path=audio_two_path,
            weight_one=weight_one,
            weight_two=weight_two,
        )
        
        return {
            "status": "success",
            "audio_url": result["audio_url"],
            "audio_id": result["audio_id"]
        }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
