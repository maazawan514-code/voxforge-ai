import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from unittest.mock import patch
from datetime import datetime, timedelta

from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.models.otp import OTPCode
from app.utils.security import hash_password
from app.config import get_settings

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Fixture to set up and tear down the test database for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def test_user(db_session: Session):
    """Fixture to create a test user in the database."""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("password123"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@patch("app.routers.auth.send_otp_email")
def test_forgot_password_success(mock_send_email, db_session: Session, test_user: User):
    """Test the forgot-password endpoint for a known user."""
    response = client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    assert response.status_code == 200
    assert "An OTP has been sent" in response.json()["message"]

    # Verify email was called
    mock_send_email.assert_called_once()
    
    # Verify OTP was created in DB
    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "test@example.com").first()
    assert otp_record is not None
    assert otp_record.purpose == "reset_password"
    assert otp_record.user_id == test_user.id

@patch("app.routers.auth.send_otp_email")
def test_register_success_sends_otp(mock_send_email, db_session: Session):
    """Test successful registration sends an OTP and creates an inactive user."""
    response = client.post(
        "/api/auth/register",
        json={"name": "New User", "email": "new@example.com", "password": "password123", "role": "user"}
    )
    assert response.status_code == 201
    assert "An OTP has been sent" in response.json()["message"]

    mock_send_email.assert_called_once()

    user = db_session.query(User).filter(User.email == "new@example.com").first()
    assert user is not None
    assert user.is_active is False
    assert user.email_verified is False

    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "new@example.com").first()
    assert otp_record is not None
    assert otp_record.purpose == "verify_email"

@patch("app.routers.auth.send_otp_email")
def test_register_existing_verified_user_fails(mock_send_email, db_session: Session, test_user: User):
    """Test that registering with an email of an already verified user fails."""
    test_user.email_verified = True
    db_session.commit()

    response = client.post(
        "/api/auth/register",
        json={"name": "Another User", "email": "test@example.com", "password": "newpassword", "role": "user"}
    )
    assert response.status_code == 400
    assert "Email already registered and verified" in response.json()["detail"]
    mock_send_email.assert_not_called()

@patch("app.routers.auth.send_otp_email")
def test_registration_and_verification_flow_e2e(mock_send_email, db_session: Session):
    """Test the full end-to-end user registration and email verification flow."""
    # 1. Register user
    client.post(
        "/api/auth/register",
        json={"name": "E2E User", "email": "e2e@example.com", "password": "password123", "role": "user"}
    )
    mock_send_email.assert_called_once()
    sent_otp = mock_send_email.call_args[0][1]

    # 2. Verify email with the correct OTP
    verify_response = client.post(
        "/api/auth/verify-email",
        json={"email": "e2e@example.com", "otp": sent_otp}
    )
    assert verify_response.status_code == 200
    token_data = verify_response.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "e2e@example.com"

    # 3. Check user is now active and verified in DB
    user = db_session.query(User).filter(User.email == "e2e@example.com").first()
    assert user is not None
    assert user.is_active is True
    assert user.email_verified is True

    # 4. Check OTP is marked as used
    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "e2e@example.com").order_by(OTPCode.created_at.desc()).first()
    assert otp_record.used is True

@patch("app.routers.auth.send_otp_email")
def test_forgot_password_unknown_user(mock_send_email, db_session: Session):
    """Test the forgot-password endpoint for an unknown user to prevent enumeration."""
    response = client.post("/api/auth/forgot-password", json={"email": "unknown@example.com"})
    assert response.status_code == 200
    assert "An OTP has been sent" in response.json()["message"]

    # Email should NOT be called for an unknown user
    mock_send_email.assert_not_called()

    # OTP record should still be created to obscure whether the user exists
    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "unknown@example.com").first()
    assert otp_record is not None
    assert otp_record.user_id is None

@patch("app.routers.auth.send_otp_email")
def test_reset_password_flow_e2e(mock_send_email, db_session: Session, test_user: User):
    """Test the full end-to-end password reset flow."""
    # 1. Request OTP
    client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    mock_send_email.assert_called_once()
    sent_otp = mock_send_email.call_args[0][1] # Get the OTP passed to the mock

    # 2. Verify OTP (this endpoint is part of the full reset, so we test it implicitly)
    # Let's test the /verify-reset-otp endpoint explicitly first
    verify_response = client.post(
        "/api/auth/verify-reset-otp",
        json={"email": "test@example.com", "otp": sent_otp}
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["message"] == "OTP verified successfully."

    # 3. Reset Password with the same OTP
    reset_response = client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com", "otp": sent_otp, "new_password": "newpassword123"}
    )
    assert reset_response.status_code == 200
    assert reset_response.json()["message"] == "Password reset successfully."

    # 4. Verify OTP is marked as used
    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "test@example.com").order_by(OTPCode.created_at.desc()).first()
    assert otp_record.used is True

    # 5. Try to log in with the new password
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "newpassword123"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # 6. Try to log in with the old password (should fail)
    login_response_old = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert login_response_old.status_code == 401

@patch("app.routers.auth.send_otp_email")
def test_reset_password_with_invalid_otp(mock_send_email, db_session: Session, test_user: User):
    """Test password reset attempt with an incorrect OTP."""
    client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    
    response = client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com", "otp": "000000", "new_password": "newpassword123"}
    )
    assert response.status_code == 400
    assert "Invalid, expired, or already used OTP" in response.json()["detail"]

@patch("app.routers.auth.send_otp_email")
def test_reset_password_with_expired_otp(mock_send_email, db_session: Session, test_user: User):
    """Test password reset attempt with an expired OTP."""
    client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    sent_otp = mock_send_email.call_args[0][1]

    # Manually expire the OTP in the database
    otp_record = db_session.query(OTPCode).filter(OTPCode.email == "test@example.com").one()
    otp_record.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db_session.commit()

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com", "otp": sent_otp, "new_password": "newpassword123"}
    )
    assert response.status_code == 400
    assert "Invalid, expired, or already used OTP" in response.json()["detail"]

@patch("app.routers.auth.send_otp_email")
def test_reset_password_with_used_otp(mock_send_email, db_session: Session, test_user: User):
    """Test that an OTP cannot be reused for password reset."""
    # Step 1: Request and use the OTP successfully
    client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    sent_otp = mock_send_email.call_args[0][1]
    
    client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com", "otp": sent_otp, "new_password": "newpassword123"}
    )

    # Step 2: Attempt to use the same OTP again
    response = client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com", "otp": sent_otp, "new_password": "anotherpassword"}
    )
    assert response.status_code == 400
    assert "Invalid, expired, or already used OTP" in response.json()["detail"]

def test_verify_otp_failure(db_session: Session, test_user: User):
    """Test the verify-reset-otp endpoint with an invalid OTP."""
    response = client.post(
        "/api/auth/verify-reset-otp",
        json={"email": "test@example.com", "otp": "111111"}
    )
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]