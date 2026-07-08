"""Audio mixer service — blends two voice audio files using pydub + librosa"""
import os
import uuid
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import librosa
import soundfile as sf
from pydub import AudioSegment


def _get_settings():
    from ..config import get_settings
    return get_settings()


class AudioMixerService:
    """Mixes two audio sources with weighted blending"""

    @staticmethod
    async def mix_voices(
        audio_one_path: str,
        audio_two_path: str,
        weight_one: float,
        weight_two: float,
        user_id: Optional[int] = None,
    ) -> dict:
        """
        Mix two audio files with specified weights (0.0–1.0 each, summing to 1.0).

        Uses pydub for format handling, librosa/numpy for the actual mixing,
        then writes the result with soundfile.
        """
        if not os.path.exists(audio_one_path):
            raise FileNotFoundError(f"Audio file not found: {audio_one_path}")
        if not os.path.exists(audio_two_path):
            raise FileNotFoundError(f"Audio file not found: {audio_two_path}")

        # Normalise weights so they always sum to exactly 1.0
        total = weight_one + weight_two
        if total <= 0:
            raise ValueError("Weights must be positive numbers.")
        weight_one = weight_one / total
        weight_two = weight_two / total

        # Load via pydub first (handles mp3/ogg/etc.) then convert to numpy
        y1, sr1 = AudioMixerService._load_audio_numpy(audio_one_path)
        y2, sr2 = AudioMixerService._load_audio_numpy(audio_two_path)

        # Resample voice-2 to match voice-1 sample rate
        if sr1 != sr2:
            y2 = librosa.resample(y2, orig_sr=sr2, target_sr=sr1)

        # Normalise both tracks to the same RMS before blending
        y1 = AudioMixerService._rms_normalise(y1)
        y2 = AudioMixerService._rms_normalise(y2)

        # Pad shorter track with silence so lengths match
        max_len = max(len(y1), len(y2))
        y1 = np.pad(y1, (0, max_len - len(y1)))
        y2 = np.pad(y2, (0, max_len - len(y2)))

        # Weighted blend
        mixed = weight_one * y1 + weight_two * y2

        # Final normalise to prevent clipping
        mixed = AudioMixerService._peak_normalise(mixed)

        # Persist
        audio_id = str(uuid.uuid4())
        output_dir = AudioMixerService._get_output_dir(user_id)
        output_file = output_dir / f"{audio_id}.wav"
        sf.write(str(output_file), mixed, sr1)

        return {
            "audio_id": audio_id,
            "file_path": str(output_file),
            "audio_url": f"/api/voice-mixer/audio/{audio_id}",
            "download_url": f"/api/voice-mixer/audio/{audio_id}/download",
            "status": "completed",
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _load_audio_numpy(path: str) -> Tuple[np.ndarray, int]:
        """Load any audio file to a mono float32 numpy array via pydub."""
        seg = AudioSegment.from_file(path)
        seg = seg.set_channels(1)          # force mono
        sr = seg.frame_rate
        samples = np.array(seg.get_array_of_samples(), dtype=np.float32)
        # Normalise int samples to [-1, 1]
        samples /= float(2 ** (seg.sample_width * 8 - 1))
        return samples, sr

    @staticmethod
    def _rms_normalise(audio: np.ndarray, target_db: float = -20.0) -> np.ndarray:
        """Normalise audio to a target RMS level in dBFS."""
        rms = float(np.sqrt(np.mean(audio ** 2)))
        if rms < 1e-10:
            return audio
        target_rms = 10 ** (target_db / 20.0)
        return np.clip(audio * (target_rms / rms), -1.0, 1.0)

    @staticmethod
    def _peak_normalise(audio: np.ndarray) -> np.ndarray:
        """Scale audio so the peak is at 0 dBFS (no clipping)."""
        peak = float(np.max(np.abs(audio)))
        if peak < 1e-10:
            return audio
        return audio / peak * 0.95   # leave a tiny headroom

    @staticmethod
    def _get_output_dir(user_id: Optional[int]) -> Path:
        settings = _get_settings()
        if user_id is not None:
            out_dir = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "mixed_voices"
        else:
            out_dir = Path(settings.UPLOAD_DIR) / "mixed_voices"
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir

    @staticmethod
    def get_mixed_audio_file(audio_id: str, user_id: Optional[int] = None) -> Optional[Path]:
        """Resolve mixed audio file path."""
        settings = _get_settings()
        if user_id is not None:
            user_file = Path(settings.UPLOAD_DIR) / f"user_{user_id}" / "mixed_voices" / f"{audio_id}.wav"
            if user_file.exists():
                return user_file
        global_file = Path(settings.UPLOAD_DIR) / "mixed_voices" / f"{audio_id}.wav"
        if global_file.exists():
            return global_file
        return None

    @staticmethod
    def delete_mixed_audio(audio_id: str, user_id: Optional[int] = None) -> bool:
        """Delete mixed audio file from disk."""
        file_path = AudioMixerService.get_mixed_audio_file(audio_id, user_id)
        if file_path and file_path.exists():
            file_path.unlink()
            return True
        return False