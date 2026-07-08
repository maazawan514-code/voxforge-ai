"""Celery task definitions — all tasks are synchronous (Celery requirement)"""
import asyncio
from celery import shared_task
from ..database import SessionLocal
from ..models.voice import AudioGeneration, ClonedVoice, Job
from ..services.tts_service import TTSService
from ..services.voice_cloning_service import VoiceCloningService
from ..services.audio_mixer import AudioMixerService


def _run_async(coro):
    """Run an async coroutine from a synchronous Celery task."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ---------------------------------------------------------------------------
# TTS Task
# ---------------------------------------------------------------------------

@shared_task(bind=True, name="app.workers.tasks.generate_tts_task", max_retries=3)
def generate_tts_task(
    self,
    generation_id: int,
    text: str,
    voice_name: str,
    model_name: str,
    speed: float = 1.0,
    user_id: int = None,
):
    """Background Celery task for TTS audio generation."""
    db = SessionLocal()
    try:
        generation = db.query(AudioGeneration).filter(AudioGeneration.id == generation_id).first()
        if not generation:
            return {"status": "error", "message": "Generation record not found"}

        generation.status = "processing"
        db.commit()

        result = TTSService.generate_tts(
            text=text,
            model_name=model_name,
            voice=voice_name,
            speed=speed,
            user_id=user_id,
        )

        generation.audio_url = result["audio_url"]
        generation.status = "completed"
        db.commit()

        return {
            "status": "success",
            "generation_id": generation_id,
            "audio_url": result["audio_url"],
        }

    except Exception as exc:
        generation = db.query(AudioGeneration).filter(AudioGeneration.id == generation_id).first()
        if generation:
            generation.status = "failed"
            generation.error_message = str(exc)
            db.commit()

        # Retry with exponential back-off (max 3 retries)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Voice Cloning Task
# ---------------------------------------------------------------------------

@shared_task(bind=True, name="app.workers.tasks.clone_voice_task", max_retries=2)
def clone_voice_task(
    self,
    clone_id: int,
    reference_audio_path: str,
    text: str,
    voice_name: str,
    model_name: str = "pocket_tts",
    user_id: int = None,
):
    """Background Celery task for voice cloning."""
    db = SessionLocal()
    try:
        cloned_voice = db.query(ClonedVoice).filter(ClonedVoice.id == clone_id).first()
        if not cloned_voice:
            return {"status": "error", "message": "Clone record not found"}

        cloned_voice.status = "processing"
        db.commit()

        # VoiceCloningService.clone_voice is async — bridge with _run_async
        result = _run_async(
            VoiceCloningService.clone_voice(
                reference_audio_path=reference_audio_path,
                text=text,
                voice_name=voice_name,
                model_name=model_name,
                user_id=user_id,
            )
        )

        cloned_voice.generated_voice_url = result["audio_url"]
        cloned_voice.status = "completed"
        db.commit()

        return {
            "status": "success",
            "clone_id": clone_id,
            "audio_url": result["audio_url"],
        }

    except Exception as exc:
        cloned_voice = db.query(ClonedVoice).filter(ClonedVoice.id == clone_id).first()
        if cloned_voice:
            cloned_voice.status = "failed"
            cloned_voice.error_message = str(exc)
            db.commit()

        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Voice Mixing Task
# ---------------------------------------------------------------------------

@shared_task(bind=True, name="app.workers.tasks.mix_voices_task", max_retries=2)
def mix_voices_task(
    self,
    mixed_voice_id: int,
    audio_one_path: str,
    audio_two_path: str,
    weight_one: float,
    weight_two: float,
    user_id: int = None,
):
    """Background Celery task for voice mixing."""
    from ..models.voice import MixedVoice

    db = SessionLocal()
    try:
        mixed_voice = db.query(MixedVoice).filter(MixedVoice.id == mixed_voice_id).first()
        if mixed_voice:
            mixed_voice.status = "processing"
            db.commit()

        result = _run_async(
            AudioMixerService.mix_voices(
                audio_one_path=audio_one_path,
                audio_two_path=audio_two_path,
                weight_one=weight_one,
                weight_two=weight_two,
                user_id=user_id,
            )
        )

        if mixed_voice:
            mixed_voice.audio_url = result["audio_url"]
            mixed_voice.status = "generated"
            db.commit()

        return {
            "status": "success",
            "audio_url": result["audio_url"],
            "audio_id": result["audio_id"],
        }

    except Exception as exc:
        if mixed_voice_id:
            record = db.query(MixedVoice).filter(MixedVoice.id == mixed_voice_id).first()
            if record:
                record.status = "failed"
                record.error_message = str(exc)
                db.commit()

        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    finally:
        db.close()