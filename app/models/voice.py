from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Voice(Base):
    """Predefined voices available in the system"""
    __tablename__ = "voices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    model_name = Column(String(50), nullable=False)  # "kokoro" or "pocket_tts"
    voice_type = Column(String(50), nullable=False)  # "male", "female", "neutral"
    preview_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    audio_generations = relationship("AudioGeneration", back_populates="voice")
    mixed_voices_one = relationship(
        "MixedVoice",
        back_populates="voice_one",
        foreign_keys="MixedVoice.voice_one_id"
    )
    mixed_voices_two = relationship(
        "MixedVoice",
        back_populates="voice_two",
        foreign_keys="MixedVoice.voice_two_id"
    )


class AudioGeneration(Base):
    """Records of generated audio from text-to-speech"""
    __tablename__ = "audio_generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    model_name = Column(String(50), nullable=False)
    voice_id = Column(Integer, ForeignKey("voices.id"), nullable=False)
    audio_url = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    user = relationship("User", backref="audio_generations")
    voice = relationship("Voice", back_populates="audio_generations")


class ClonedVoice(Base):
    """User-created cloned voices"""
    __tablename__ = "cloned_voices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    reference_audio_url = Column(String(500), nullable=False)
    generated_voice_url = Column(String(500), nullable=True)
    model_name = Column(String(50), nullable=False)  # "pocket_tts", etc
    status = Column(String(20), default="processing")  # processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="cloned_voices")


class MixedVoice(Base):
    """User-created mixed voice presets"""
    __tablename__ = "mixed_voices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    voice_one_id = Column(Integer, ForeignKey("voices.id"), nullable=False)
    voice_two_id = Column(Integer, ForeignKey("voices.id"), nullable=False)
    voice_one_weight = Column(Float, nullable=False)  # 0-1 scale
    voice_two_weight = Column(Float, nullable=False)  # 0-1 scale
    created_at = Column(DateTime, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="mixed_voices")
    voice_one = relationship("Voice", back_populates="mixed_voices_one", foreign_keys=[voice_one_id])
    voice_two = relationship("Voice", back_populates="mixed_voices_two", foreign_keys=[voice_two_id])

    audio_url = Column(String(500), nullable=True)
    status = Column(String(20), default="preset")  # preset, generated, failed
    error_message = Column(Text, nullable=True)


class FavoriteAudio(Base):
    """User favorite audio records"""
    __tablename__ = "favorite_audios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    audio_type = Column(String(50), nullable=False)  # "tts", "clone", "mixed"
    audio_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", backref="favorites")


class ShareToken(Base):
    """Public share tokens for audio files"""
    __tablename__ = "share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    audio_type = Column(String(50), nullable=False)
    audio_id = Column(Integer, nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", backref="share_tokens")


class Job(Base):
    """Background job tracking"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_type = Column(String(50), nullable=False)  # "tts", "voice_clone", "voice_mix"
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0-100
    result_url = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    user = relationship("User", backref="jobs")
