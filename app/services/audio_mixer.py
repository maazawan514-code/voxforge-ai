"""Audio mixer service for blending voices"""
import os
import uuid
from pathlib import Path
from typing import Tuple
import numpy as np
import librosa
import soundfile as sf
from pydub import AudioSegment
from config import get_settings

settings = get_settings()


class AudioMixerService:
    """Service for mixing multiple audio sources"""
    
    @staticmethod
    async def mix_voices(
        audio_one_path: str,
        audio_two_path: str,
        weight_one: float,
        weight_two: float,
        user_id: int | None = None,
    ) -> dict:
        """
        Mix two audio files with specified weights
        
        Args:
            audio_one_path: Path to first audio file
            audio_two_path: Path to second audio file
            weight_one: Weight for first audio (0-1)
            weight_two: Weight for second audio (0-1)
            user_id: Optional user ID for file organization
        
        Returns:
            dict: Mixed audio file info
        """
        try:
            if not os.path.exists(audio_one_path):
                raise FileNotFoundError(f"Audio file not found: {audio_one_path}")
            if not os.path.exists(audio_two_path):
                raise FileNotFoundError(f"Audio file not found: {audio_two_path}")
            
            # Load audio files
            y1, sr1 = librosa.load(audio_one_path, sr=None)
            y2, sr2 = librosa.load(audio_two_path, sr=None)
            
            # Resample if needed
            if sr1 != sr2:
                y2 = librosa.resample(y2, orig_sr=sr2, target_sr=sr1)
            
            # Normalize and mix
            y1_norm = AudioMixerService._normalize_audio(y1)
            y2_norm = AudioMixerService._normalize_audio(y2)
            
            # Equalize lengths
            min_len = min(len(y1_norm), len(y2_norm))
            y1_norm = y1_norm[:min_len]
            y2_norm = y2_norm[:min_len]
            
            # Mix with weights
            mixed = weight_one * y1_norm + weight_two * y2_norm
            
            # Normalize mixed audio
            mixed = AudioMixerService._normalize_audio(mixed)
            
            # Save mixed audio
            audio_id = str(uuid.uuid4())
            if user_id is not None:
                output_dir = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "mixed_voices"
            else:
                output_dir = Path(settings.UPLOAD_DIR) / "mixed_voices"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"{audio_id}.wav"
            sf.write(str(output_file), mixed, sr1)
            
            return {
                "audio_id": audio_id,
                "file_path": str(output_file),
                "audio_url": f"/api/voice-mixer/audio/{audio_id}",
                "download_url": f"/api/voice-mixer/audio/{audio_id}/download",
                "status": "completed",
            }
        
        except Exception as e:
            raise Exception(f"Audio mixing failed: {str(e)}")
    
    @staticmethod
    def _normalize_audio(audio: np.ndarray, target_level: float = -20.0) -> np.ndarray:
        """
        Normalize audio to prevent clipping
        
        Args:
            audio: Audio array
            target_level: Target loudness in dB (typically -20 to -6)
        
        Returns:
            Normalized audio array
        """
        # Calculate current RMS
        rms = np.sqrt(np.mean(audio ** 2))
        
        if rms < 1e-10:
            return audio
        
        # Convert target level from dB to linear
        target_rms = 10 ** (target_level / 20.0)
        
        # Normalize
        normalized = audio * (target_rms / rms)
        
        # Clip to [-1, 1] range
        return np.clip(normalized, -1.0, 1.0)
    
    @staticmethod
    def get_mixed_audio_file(audio_id: str, user_id: int | None = None):
        """Get mixed audio file path"""
        if user_id is not None:
            user_file = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "mixed_voices" / f"{audio_id}.wav"
            if user_file.exists():
                return user_file
        global_file = Path(settings.UPLOAD_DIR) / "mixed_voices" / f"{audio_id}.wav"
        if global_file.exists():
            return global_file
        return None

    @staticmethod
    def delete_mixed_audio(audio_id: str, user_id: int | None = None) -> bool:
        """Delete mixed audio file"""
        try:
            file_path = AudioMixerService.get_mixed_audio_file(audio_id, user_id)
            if file_path and file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            raise Exception(f"Failed to delete mixed audio: {str(e)}")
