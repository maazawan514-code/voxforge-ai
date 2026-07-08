import soundfile as sf
import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
import numpy as np
import librosa
from ..config import get_settings

try:
    from kokoro_onnx import Kokoro
    KOKORO_AVAILABLE = True
except ImportError:
    KOKORO_AVAILABLE = False

settings = get_settings()
AUDIO_DIR = settings.UPLOAD_DIR
os.makedirs(AUDIO_DIR, exist_ok=True)

# Initialize Kokoro model if available
kokoro = None
if KOKORO_AVAILABLE and os.path.exists("app/onnx/model.onnx"):
    try:
        kokoro = Kokoro("app/onnx/model.onnx", "app/voices.bin")
    except Exception as e:
        print(f"Warning: Could not load Kokoro model: {e}")
        kokoro = None


class TTSService:
    """Service for text-to-speech generation"""
    
    # Available voices mapping
    AVAILABLE_VOICES = {
        "kokoro": [
            {"id": 1, "name": "af_sarah", "type": "female"},
            {"id": 2, "name": "af_michael", "type": "male"},
            {"id": 3, "name": "af_nicole", "type": "female"},
            {"id": 4, "name": "af_biden", "type": "male"},
            {"id": 5, "name": "af_alloy", "type": "male"},
        ],
        "pocket_tts": [
            {"id": 6, "name": "voice_1", "type": "male"},
            {"id": 7, "name": "voice_2", "type": "female"},
            {"id": 8, "name": "voice_3", "type": "neutral"},
        ]
    }
    
    @staticmethod
    def generate_tts(
        text: str,
        model_name: str = "kokoro",
        voice: str = "af_sarah",
        speed: float = 1.0,
        user_id: Optional[int] = None,
    ) -> dict:
        """
        Generate speech from text
        
        Args:
            text: Text to convert to speech
            model_name: TTS model ('kokoro' or 'pocket_tts')
            voice: Voice ID/name
            speed: Speech speed multiplier
            user_id: User ID for file organization
        
        Returns:
            dict: Generated audio file info including duration and waveform data
        """
        try:
            if model_name == "kokoro" and KOKORO_AVAILABLE and kokoro:
                return TTSService._generate_with_kokoro(text, voice, speed, user_id)
            elif model_name == "pocket_tts":
                return TTSService._generate_with_pocket_tts(text, voice, speed, user_id)
            else:
                # Fallback: generate placeholder audio
                return TTSService._generate_placeholder(text, voice, user_id)
        
        except Exception as e:
            raise Exception(f"TTS generation failed: {str(e)}")
    
    @staticmethod
    def _generate_with_kokoro(
        text: str,
        voice: str,
        speed: float,
        user_id: Optional[int] = None
    ) -> dict:
        """Generate audio using Kokoro TTS"""
        if not kokoro:
            raise Exception("Kokoro model not initialized")
        
        audio_id = str(uuid.uuid4())
        
        # Create user-specific directory if user_id provided
        if user_id:
            user_dir = Path(AUDIO_DIR) / f"user_{user_id}"
            user_dir.mkdir(parents=True, exist_ok=True)
            filename = user_dir / f"{audio_id}.wav"
        else:
            filename = Path(AUDIO_DIR) / f"{audio_id}.wav"
        
        try:
            # Generate with Kokoro
            samples, sample_rate = kokoro.create(
                text,
                voice=voice,
                speed=speed,
                lang="en-us"
            )
            
            # Save audio
            sf.write(str(filename), samples, sample_rate)
            
            # Get duration and waveform info
            duration = len(samples) / sample_rate
            
            return {
                "audio_id": audio_id,
                "file_path": str(filename),
                "audio_url": f"/api/audio/{audio_id}",
                "download_url": f"/api/audio/{audio_id}/download",
                "duration": duration,
                "sample_rate": sample_rate,
                "status": "completed",
            }
        except Exception as e:
            raise Exception(f"Kokoro generation failed: {str(e)}")
    
    @staticmethod
    def _generate_with_pocket_tts(
        text: str,
        voice: str,
        speed: float,
        user_id: Optional[int] = None
    ) -> dict:
        """Generate audio using Pocket TTS"""
        audio_id = str(uuid.uuid4())
        
        # Create user-specific directory if user_id provided
        if user_id:
            user_dir = Path(AUDIO_DIR) / f"user_{user_id}"
            user_dir.mkdir(parents=True, exist_ok=True)
            filename = user_dir / f"{audio_id}.wav"
        else:
            filename = Path(AUDIO_DIR) / f"{audio_id}.wav"
        
        # TODO: Integrate with actual Pocket TTS library
        # For now, create placeholder
        # Generate synthetic audio as placeholder
        duration = len(text) * 0.05  # Rough estimate: 50ms per character
        sample_rate = 22050
        num_samples = int(duration * sample_rate)
        
        # Create simple audio data
        t = np.linspace(0, duration, num_samples)
        samples = 0.1 * np.sin(2 * np.pi * 440 * t)  # 440 Hz tone
        
        sf.write(str(filename), samples, sample_rate)
        
        return {
            "audio_id": audio_id,
            "file_path": str(filename),
            "audio_url": f"/api/audio/{audio_id}",
            "download_url": f"/api/audio/{audio_id}/download",
            "duration": duration,
            "sample_rate": sample_rate,
            "status": "completed",
        }
    
    @staticmethod
    def _generate_placeholder(text: str, voice: str, user_id: Optional[int] = None) -> dict:
        """Generate placeholder audio"""
        audio_id = str(uuid.uuid4())
        
        if user_id:
            user_dir = Path(AUDIO_DIR) / f"user_{user_id}"
            user_dir.mkdir(parents=True, exist_ok=True)
            filename = user_dir / f"{audio_id}.wav"
        else:
            filename = Path(AUDIO_DIR) / f"{audio_id}.wav"
        
        # Generate simple tone
        duration = len(text) * 0.05
        sample_rate = 22050
        num_samples = int(duration * sample_rate)
        
        t = np.linspace(0, duration, num_samples)
        samples = 0.1 * np.sin(2 * np.pi * 440 * t)
        
        sf.write(str(filename), samples, sample_rate)
        
        return {
            "audio_id": audio_id,
            "file_path": str(filename),
            "audio_url": f"/api/audio/{audio_id}",
            "download_url": f"/api/audio/{audio_id}/download",
            "duration": duration,
            "sample_rate": sample_rate,
            "status": "completed",
        }
    
    @staticmethod
    def get_audio_file(audio_id: str, user_id: Optional[int] = None) -> Optional[Path]:
        """Get audio file path"""
        # Try user-specific directory first
        if user_id:
            user_file = Path(AUDIO_DIR) / f"user_{user_id}" / f"{audio_id}.wav"
            if user_file.exists():
                return user_file
        
        # Try global directory
        global_file = Path(AUDIO_DIR) / f"{audio_id}.wav"
        if global_file.exists():
            return global_file
        
        return None
    
    @staticmethod
    def get_audio_waveform(audio_path: str, n_mels: int = 128) -> dict:
        """Extract waveform data for visualization"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Generate mel spectrogram for visualization
            S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels)
            S_db = librosa.power_to_db(S, ref=np.max)
            
            # Normalize to 0-1 range
            S_normalized = (S_db - S_db.min()) / (S_db.max() - S_db.min())
            
            return {
                "duration": duration,
                "sample_rate": sr,
                "samples": len(y),
                "waveform": S_normalized.tolist(),  # For UI visualization
                "min_db": float(S_db.min()),
                "max_db": float(S_db.max()),
            }
        except Exception as e:
            raise Exception(f"Failed to extract waveform: {str(e)}")
    
    @staticmethod
    def delete_audio(audio_id: str, user_id: Optional[int] = None) -> bool:
        """Delete generated audio file"""
        try:
            file_path = TTSService.get_audio_file(audio_id, user_id)
            if file_path and file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            raise Exception(f"Failed to delete audio: {str(e)}")
    
    @staticmethod
    def get_available_voices(model_name: str = None) -> dict:
        """Get available voices for TTS models"""
        if model_name:
            return {model_name: TTSService.AVAILABLE_VOICES.get(model_name, [])}
        return TTSService.AVAILABLE_VOICES