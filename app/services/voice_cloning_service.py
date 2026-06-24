"""Voice cloning service"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
import librosa
import soundfile as sf
import numpy as np
from config import get_settings

settings = get_settings()


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
        Clone a voice from reference audio
        
        Args:
            reference_audio_path: Path to reference audio file
            text: Text to synthesize with cloned voice
            voice_name: Name for the cloned voice
            model_name: Cloning model ('pocket_tts', etc)
            user_id: User ID for file organization
        
        Returns:
            dict: Cloned voice generation result
        """
        try:
            if not os.path.exists(reference_audio_path):
                raise FileNotFoundError(f"Reference audio not found: {reference_audio_path}")
            
            # Validate reference audio
            audio_info = VoiceCloningService._validate_reference_audio(reference_audio_path)
            
            if model_name == "pocket_tts":
                return await VoiceCloningService._clone_with_pocket_tts(
                    reference_audio_path, text, voice_name, user_id
                )
            else:
                # Fallback: generate with reference audio characteristics
                return await VoiceCloningService._clone_generic(
                    reference_audio_path, text, voice_name, user_id
                )
        
        except Exception as e:
            raise Exception(f"Voice cloning failed: {str(e)}")
    
    @staticmethod
    def _validate_reference_audio(audio_path: str) -> dict:
        """Validate reference audio file"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Check duration (recommended: 5-30 seconds)
            if duration < 2:
                raise ValueError("Audio too short. Minimum 2 seconds recommended.")
            if duration > 120:
                raise ValueError("Audio too long. Maximum 120 seconds.")
            
            # Check for sufficient energy (not too quiet)
            rms = np.sqrt(np.mean(y ** 2))
            if rms < 0.01:
                raise ValueError("Audio is too quiet. Please use a clearer voice sample.")
            
            return {
                "duration": duration,
                "sample_rate": sr,
                "rms": float(rms),
                "channels": 1 if len(y.shape) == 1 else y.shape[0],
            }
        
        except Exception as e:
            raise Exception(f"Audio validation failed: {str(e)}")
    
    @staticmethod
    async def _clone_with_pocket_tts(
        reference_audio_path: str,
        text: str,
        voice_name: str,
        user_id: Optional[int] = None,
    ) -> dict:
        """Clone voice using Pocket TTS"""
        # TODO: Integrate with actual Pocket TTS cloning API
        # For now, create a synthetic voice based on reference characteristics
        
        audio_id = str(uuid.uuid4())
        
        # Create user-specific directory if user_id provided
        if user_id:
            user_dir = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices"
            user_dir.mkdir(parents=True, exist_ok=True)
            output_file = user_dir / f"{audio_id}.wav"
        else:
            output_dir = Path(settings.UPLOAD_DIR) / "cloned_voices"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"{audio_id}.wav"
        
        # Load reference audio characteristics
        y_ref, sr_ref = librosa.load(reference_audio_path, sr=None)
        
        # Generate synthetic audio (placeholder - would use actual cloning model)
        duration = len(text) * 0.05  # Rough estimate
        num_samples = int(duration * sr_ref)
        t = np.linspace(0, duration, num_samples)
        
        # Create audio based on reference characteristics
        # In production, this would use the reference voice embedding
        samples = 0.1 * np.sin(2 * np.pi * 220 * t)
        samples = VoiceCloningService._apply_voice_characteristics(samples, y_ref)
        
        sf.write(str(output_file), samples, sr_ref)
        
        return {
            "voice_id": audio_id,
            "file_path": str(output_file),
            "audio_url": f"/api/audio/cloned/{audio_id}",
            "status": "completed",
        }
    
    @staticmethod
    async def _clone_generic(
        reference_audio_path: str,
        text: str,
        voice_name: str,
        user_id: Optional[int] = None,
    ) -> dict:
        """Generic voice cloning fallback"""
        audio_id = str(uuid.uuid4())
        
        if user_id:
            user_dir = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices"
            user_dir.mkdir(parents=True, exist_ok=True)
            output_file = user_dir / f"{audio_id}.wav"
        else:
            output_dir = Path(settings.UPLOAD_DIR) / "cloned_voices"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"{audio_id}.wav"
        
        # Copy reference audio as placeholder
        shutil.copy(reference_audio_path, str(output_file))
        
        return {
            "voice_id": audio_id,
            "file_path": str(output_file),
            "audio_url": f"/api/audio/cloned/{audio_id}",
            "status": "completed",
        }
    
    @staticmethod
    def _apply_voice_characteristics(audio: np.ndarray, reference: np.ndarray) -> np.ndarray:
        """Apply reference audio characteristics to generated audio"""
        # Extract spectral characteristics from reference
        # and apply to generated audio
        
        # For now, just normalize to match reference energy
        ref_rms = np.sqrt(np.mean(reference ** 2))
        audio_rms = np.sqrt(np.mean(audio ** 2))
        
        if audio_rms > 0:
            audio = audio * (ref_rms / audio_rms)
        
        return np.clip(audio, -1.0, 1.0)
    
    @staticmethod
    def delete_cloned_voice(voice_id: str, user_id: Optional[int] = None) -> bool:
        """Delete cloned voice files"""
        try:
            # Try user-specific directory first
            if user_id:
                user_file = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices" / f"{voice_id}.wav"
                if user_file.exists():
                    user_file.unlink()
                    return True
            
            # Try global directory
            global_file = Path(settings.UPLOAD_DIR) / "cloned_voices" / f"{voice_id}.wav"
            if global_file.exists():
                global_file.unlink()
                return True
            
            return False
        except Exception as e:
            raise Exception(f"Failed to delete cloned voice: {str(e)}")
    
    @staticmethod
    def get_cloned_voice_file(voice_id: str, user_id: Optional[int] = None):
        """Get cloned voice file path"""
        # Try user-specific directory first
        if user_id:
            user_file = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "cloned_voices" / f"{voice_id}.wav"
            if user_file.exists():
                return user_file
        
        # Try global directory
        global_file = Path(settings.UPLOAD_DIR) / "cloned_voices" / f"{voice_id}.wav"
        if global_file.exists():
            return global_file
        
        return None
