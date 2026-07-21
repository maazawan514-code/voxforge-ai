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
            {"id": 1, "name": "af_alloy", "type": "female"},
            {"id": 2, "name": "af_aoede", "type": "female"},
            {"id": 3, "name": "af_bella", "type": "female"},
            {"id": 4, "name": "af_heart", "type": "female"},
            {"id": 5, "name": "af_jessica", "type": "female"},
            {"id": 6, "name": "af_kore", "type": "female"},
            {"id": 7, "name": "af_nicole", "type": "female"},
            {"id": 8, "name": "af_nova", "type": "female"},
            {"id": 9, "name": "af_river", "type": "female"},
            {"id": 10, "name": "af_sarah", "type": "female"},
            {"id": 11, "name": "af_sky", "type": "female"},
            {"id": 12, "name": "am_adam", "type": "male"},
            {"id": 13, "name": "am_echo", "type": "male"},
            {"id": 14, "name": "am_eric", "type": "male"},
            {"id": 15, "name": "am_fenrir", "type": "male"},
            {"id": 16, "name": "am_liam", "type": "male"},
            {"id": 17, "name": "am_michael", "type": "male"},
            {"id": 18, "name": "am_onyx", "type": "male"},
            {"id": 19, "name": "am_puck", "type": "male"},
            {"id": 20, "name": "am_santa", "type": "male"},
            {"id": 21, "name": "bf_alice", "type": "female"},
            {"id": 22, "name": "bf_emma", "type": "female"},
            {"id": 23, "name": "bf_isabella", "type": "female"},
            {"id": 24, "name": "bf_lily", "type": "female"},
            {"id": 25, "name": "bm_daniel", "type": "male"},
            {"id": 26, "name": "bm_fable", "type": "male"},
            {"id": 27, "name": "bm_george", "type": "male"},
            {"id": 28, "name": "bm_lewis", "type": "male"},
            {"id": 29, "name": "ef_dora", "type": "female"},
            {"id": 30, "name": "em_alex", "type": "male"},
            {"id": 31, "name": "em_santa", "type": "male"},
            {"id": 32, "name": "ff_siwis", "type": "female"},
            {"id": 33, "name": "hf_alpha", "type": "female"},
            {"id": 34, "name": "hf_beta", "type": "female"},
            {"id": 35, "name": "hm_omega", "type": "male"},
            {"id": 36, "name": "hm_psi", "type": "male"},
            {"id": 37, "name": "if_sara", "type": "female"},
            {"id": 38, "name": "im_nicola", "type": "male"},
            {"id": 39, "name": "jf_alpha", "type": "female"},
            {"id": 40, "name": "jf_gongitsune", "type": "female"},
            {"id": 41, "name": "jf_nezumi", "type": "female"},
            {"id": 42, "name": "jf_tebukuro", "type": "female"},
            {"id": 43, "name": "jm_kumo", "type": "male"},
            {"id": 44, "name": "pf_dora", "type": "female"},
            {"id": 45, "name": "pm_alex", "type": "male"},
            {"id": 46, "name": "pm_santa", "type": "male"},
            {"id": 47, "name": "zf_xiaobei", "type": "female"},
            {"id": 48, "name": "zf_xiaoni", "type": "female"},
            {"id": 49, "name": "zf_xiaoxiao", "type": "female"},
            {"id": 50, "name": "zf_xiaoyi", "type": "female"},
            {"id": 51, "name": "zm_yunjian", "type": "male"},
            {"id": 52, "name": "zm_yunxi", "type": "male"},
            {"id": 53, "name": "zm_yunxia", "type": "male"},
            {"id": 54, "name": "zm_yunyang", "type": "male"},
        ],
        "pocket_tts": [
            {"id": 55, "name": "voice_1", "type": "male"},
            {"id": 56, "name": "voice_2", "type": "female"},
            {"id": 57, "name": "voice_3", "type": "neutral"},
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