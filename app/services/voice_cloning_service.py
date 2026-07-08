"""Voice cloning service"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
import librosa
import soundfile as sf
import numpy as np


def _get_settings():
    """Lazy import to avoid circular imports"""
    from ..config import get_settings
    return get_settings()


class VoiceCloningService:
    """Service for voice cloning"""

    @staticmethod
    async def clone_voice(
        reference_audio_path: str,
        text: str,
        voice_name: str,
        model_name: str = "pocket_tts",
        user_id: Optional[int] = None,
    ) -> dict:
        """
        Clone a voice from reference audio.
        Returns dict with audio_url, file_path, voice_id, status.
        """
        if not os.path.exists(reference_audio_path):
            raise FileNotFoundError(f"Reference audio not found: {reference_audio_path}")

        # Validate before cloning
        VoiceCloningService._validate_reference_audio(reference_audio_path)

        if model_name == "pocket_tts":
            return await VoiceCloningService._clone_with_pocket_tts(
                reference_audio_path, text, voice_name, user_id
            )
        else:
            return await VoiceCloningService._clone_generic(
                reference_audio_path, text, voice_name, user_id
            )

    @staticmethod
    def _validate_reference_audio(audio_path: str) -> dict:
        """Validate reference audio quality and duration"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)

            if duration < 2:
                raise ValueError("Audio too short — minimum 2 seconds required.")
            if duration > 120:
                raise ValueError("Audio too long — maximum 120 seconds allowed.")

            rms = float(np.sqrt(np.mean(y ** 2)))
            if rms < 0.01:
                raise ValueError("Audio is too quiet — please use a clearer voice sample.")

            return {
                "duration": round(duration, 2),
                "sample_rate": sr,
                "rms": rms,
                "channels": 1 if y.ndim == 1 else y.shape[0],
            }
        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Audio validation failed: {str(e)}")

    @staticmethod
    def _get_output_dir(user_id: Optional[int]) -> Path:
        """Return (and create) the correct output directory for cloned voices"""
        settings = _get_settings()
        if user_id:
            out_dir = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices"
        else:
            out_dir = Path(settings.UPLOAD_DIR) / "cloned_voices"
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir

    @staticmethod
    async def _clone_with_pocket_tts(
        reference_audio_path: str,
        text: str,
        voice_name: str,
        user_id: Optional[int] = None,
    ) -> dict:
        """
        Clone voice using Pocket TTS.
        TODO: Replace synthesis block with real Pocket TTS API call when available.
        """
        audio_id = str(uuid.uuid4())
        output_dir = VoiceCloningService._get_output_dir(user_id)
        output_file = output_dir / f"{audio_id}.wav"

        # Load reference to capture acoustic characteristics
        y_ref, sr_ref = librosa.load(reference_audio_path, sr=None)

        # --- Placeholder synthesis (replace with real model call) ---
        # Estimate rough duration from text length (~0.06s per char is conservative)
        estimated_duration = max(1.0, len(text) * 0.06)
        num_samples = int(estimated_duration * sr_ref)
        t = np.linspace(0, estimated_duration, num_samples)

        # Build a basic voiced signal shaped by reference energy
        base_freq = 180.0  # neutral pitch — Pocket TTS would infer this from reference
        samples = 0.15 * np.sin(2 * np.pi * base_freq * t)
        # Add subtle harmonics for realism
        samples += 0.07 * np.sin(2 * np.pi * base_freq * 2 * t)
        samples += 0.03 * np.sin(2 * np.pi * base_freq * 3 * t)
        # Match reference energy level
        samples = VoiceCloningService._match_energy(samples, y_ref)
        # --- End placeholder ---

        sf.write(str(output_file), samples, sr_ref)

        return {
            "voice_id": audio_id,
            "file_path": str(output_file),
            "audio_url": f"/api/voice-clone/audio/generated/{audio_id}",
            "status": "completed",
        }

    @staticmethod
    async def _clone_generic(
        reference_audio_path: str,
        text: str,
        voice_name: str,
        user_id: Optional[int] = None,
    ) -> dict:
        """Generic fallback — copies reference audio as output placeholder"""
        audio_id = str(uuid.uuid4())
        output_dir = VoiceCloningService._get_output_dir(user_id)
        output_file = output_dir / f"{audio_id}.wav"

        shutil.copy(reference_audio_path, str(output_file))

        return {
            "voice_id": audio_id,
            "file_path": str(output_file),
            "audio_url": f"/api/voice-clone/audio/generated/{audio_id}",
            "status": "completed",
        }

    @staticmethod
    def _match_energy(audio: np.ndarray, reference: np.ndarray) -> np.ndarray:
        """Scale audio so its RMS matches the reference audio"""
        ref_rms = float(np.sqrt(np.mean(reference ** 2)))
        audio_rms = float(np.sqrt(np.mean(audio ** 2)))
        if audio_rms > 1e-8:
            audio = audio * (ref_rms / audio_rms)
        return np.clip(audio, -1.0, 1.0)

    @staticmethod
    def get_cloned_voice_file(voice_id: str, user_id: Optional[int] = None) -> Optional[Path]:
        """Resolve cloned voice file path (user-specific first, then global)"""
        settings = _get_settings()
        if user_id:
            user_file = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices" / f"{voice_id}.wav"
            if user_file.exists():
                return user_file
        global_file = Path(settings.UPLOAD_DIR) / "cloned_voices" / f"{voice_id}.wav"
        if global_file.exists():
            return global_file
        return None

    @staticmethod
    def delete_cloned_voice(voice_id: str, user_id: Optional[int] = None) -> bool:
        """Delete cloned voice file from disk"""
        file_path = VoiceCloningService.get_cloned_voice_file(voice_id, user_id)
        if file_path and file_path.exists():
            file_path.unlink()
            return True
        return False