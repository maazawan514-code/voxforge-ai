"""One-off script to fix voice name and type errors in the database"""
from .database import SessionLocal
from .models.voice import Voice


def fix_voice_names():
    """Fix the three incorrect voice entries in the database"""
    db = SessionLocal()
    
    try:
        print("\n🎙️  VoxForge AI - Fix Voice Names")
        print("=" * 40)
        
        updates_made = 0
        
        # Fix 1: af_michael -> am_michael (name was wrong, type was correct)
        af_michael = db.query(Voice).filter(Voice.name == "af_michael").first()
        if af_michael:
            print(f"\n✓ Updating 'af_michael':")
            print(f"  - Old: name='af_michael', voice_type='{af_michael.voice_type}'")
            af_michael.name = "am_michael"
            af_michael.preview_url = "https://example.com/preview/am_michael.wav"
            print(f"  - New: name='am_michael', voice_type='{af_michael.voice_type}'")
            updates_made += 1
        else:
            print(f"\n⚠ Voice 'af_michael' not found in database")
        
        # Fix 2: af_biden -> af_bella (voice doesn't exist, replace with real one) + voice_type to female
        af_biden = db.query(Voice).filter(Voice.name == "af_biden").first()
        if af_biden:
            print(f"\n✓ Updating 'af_biden':")
            print(f"  - Old: name='af_biden', voice_type='{af_biden.voice_type}'")
            af_biden.name = "af_bella"
            af_biden.voice_type = "female"
            af_biden.preview_url = "https://example.com/preview/af_bella.wav"
            print(f"  - New: name='af_bella', voice_type='female'")
            updates_made += 1
        else:
            print(f"\n⚠ Voice 'af_biden' not found in database")
        
        # Fix 3: af_alloy voice_type should be female (af_ prefix = female)
        af_alloy = db.query(Voice).filter(Voice.name == "af_alloy").first()
        if af_alloy:
            print(f"\n✓ Updating 'af_alloy':")
            print(f"  - Old: name='af_alloy', voice_type='{af_alloy.voice_type}'")
            af_alloy.voice_type = "female"
            print(f"  - New: name='af_alloy', voice_type='female'")
            updates_made += 1
        else:
            print(f"\n⚠ Voice 'af_alloy' not found in database")
        
        # Commit all changes
        if updates_made > 0:
            db.commit()
            print(f"\n✅ Successfully updated {updates_made} voice(s)")
        else:
            print(f"\n⚠️  No voices needed updating")
        
        print("\n" + "=" * 40 + "\n")
    
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error fixing voice names: {str(e)}\n")
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    fix_voice_names()
