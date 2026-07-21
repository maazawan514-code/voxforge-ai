import requests
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.otp import OTPCode
from app.utils.security import hash_password, hash_otp_code
from datetime import datetime, timedelta

BASE = "http://127.0.0.1:8000"

# Prepare DB
Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'test.user@example.com').first()
    if not user:
        user = User(name='Test User', email='test.user@example.com', password_hash=hash_password('testpassword123'))
        db.add(user)
        db.commit()
        db.refresh(user)
        print('Created user id', user.id)
    else:
        print('User exists id', user.id)

    otp_plain = '654321'
    otp_hash = hash_otp_code(otp_plain)
    expires = datetime.utcnow() + timedelta(minutes=15)
    otp_entry = OTPCode(user_id=user.id, email=user.email, otp_hash=otp_hash, purpose='reset_password', expires_at=expires)
    db.add(otp_entry)
    db.commit()
    print('Inserted OTP for test:', otp_plain)
finally:
    db.close()

# Now call endpoints
print('\nCalling /api/auth/forgot-password')
r = requests.post(BASE + '/api/auth/forgot-password', json={'email': 'test.user@example.com'})
print(r.status_code, r.text)

print('\nCalling /api/auth/verify-reset-otp with OTP 654321')
r = requests.post(BASE + '/api/auth/verify-reset-otp', json={'email': 'test.user@example.com', 'otp': otp_plain})
print(r.status_code, r.text)

print('\nCalling /api/auth/reset-password with new password')
r = requests.post(BASE + '/api/auth/reset-password', json={'email': 'test.user@example.com', 'otp': otp_plain, 'new_password': 'newpass123'})
print(r.status_code, r.text)
