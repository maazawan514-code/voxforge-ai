"""Database initialization script - seeds voices and sample data"""
from pathlib import Path

from .database import SessionLocal
from .models.voice import Voice
from .models.user import User
from .utils.security import hash_password


def init_voices():
    """Initialize default voices"""
    db = SessionLocal()
    
    try:
        # Check if voices already exist
        existing_voices = db.query(Voice).count()
        if existing_voices > 0:
            print(f"✓ Voices already initialized ({existing_voices} voices found)")
            return
        
        # Kokoro TTS voices
        kokoro_voices = [
            Voice(
                name="af_sarah",
                model_name="kokoro",
                voice_type="female",
                preview_url="https://example.com/preview/af_sarah.wav",
                is_active=True,
            ),
            Voice(
                name="af_michael",
                model_name="kokoro",
                voice_type="male",
                preview_url="https://example.com/preview/af_michael.wav",
                is_active=True,
            ),
            Voice(
                name="af_nicole",
                model_name="kokoro",
                voice_type="female",
                preview_url="https://example.com/preview/af_nicole.wav",
                is_active=True,
            ),
            Voice(
                name="af_biden",
                model_name="kokoro",
                voice_type="male",
                preview_url="https://example.com/preview/af_biden.wav",
                is_active=True,
            ),
            Voice(
                name="af_alloy",
                model_name="kokoro",
                voice_type="male",
                preview_url="https://example.com/preview/af_alloy.wav",
                is_active=True,
            ),
        ]
        
        # Pocket TTS voices
        pocket_voices = [
            Voice(
                name="voice_1",
                model_name="pocket_tts",
                voice_type="male",
                preview_url="https://example.com/preview/pocket_1.wav",
                is_active=True,
            ),
            Voice(
                name="voice_2",
                model_name="pocket_tts",
                voice_type="female",
                preview_url="https://example.com/preview/pocket_2.wav",
                is_active=True,
            ),
            Voice(
                name="voice_3",
                model_name="pocket_tts",
                voice_type="neutral",
                preview_url="https://example.com/preview/pocket_3.wav",
                is_active=True,
            ),
        ]
        
        # Add all voices
        db.add_all(kokoro_voices + pocket_voices)
        db.commit()
        
        print(f"✓ Initialized {len(kokoro_voices) + len(pocket_voices)} voices")
        print(f"  - Kokoro: {len(kokoro_voices)} voices")
        print(f"  - Pocket TTS: {len(pocket_voices)} voices")
    
    except Exception as e:
        db.rollback()
        print(f"✗ Error initializing voices: {str(e)}")
    
    finally:
        db.close()


def init_admin_user():
    """Initialize default admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin_email = "admin@voxforge.ai"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if existing_admin:
            print(f"✓ Admin user already exists ({admin_email})")
            return
        
        # Create admin user
        admin_user = User(
            name="Admin",
            email=admin_email,
            password_hash=hash_password("admin123"),
            role="admin",
            is_active=True,
        )
        
        db.add(admin_user)
        db.commit()
        
        print(f"✓ Admin user created")
        print(f"  - Email: {admin_email}")
        print(f"  - Password: admin123 (CHANGE IN PRODUCTION)")
    
    except Exception as e:
        db.rollback()
        print(f"✗ Error initializing admin user: {str(e)}")
    
    finally:
        db.close()


def main():
    """Run all initialization scripts"""
    print("\n🎙️  VoxForge AI - Database Initialization")
    print("=" * 40)
    
    print("\n📦 Initializing voices...")
    init_voices()
    
    print("\n👤 Initializing admin user...")
    init_admin_user()
    
    print("\n✅ Database initialization complete!\n")


if __name__ == "__main__":
    main()
