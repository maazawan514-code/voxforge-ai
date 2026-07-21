from datetime import datetime, timedelta, timezone
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.otp import OTPCode
from ..models.user import User
from ..schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    OTPVerifyRequest,
    PasswordChange,
    ResendOTPRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from ..utils.email import send_email
from ..utils.security import (
    clear_auth_cookie,
    create_access_token,
    create_refresh_token,
    generate_otp_code,
    get_current_user,
    hash_otp_code,
    hash_password,
    hash_token,
    set_auth_cookie,
    set_refresh_cookie,
    verify_otp_code,
    verify_password,
    verify_token,
)
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id, name=user.name, email=user.email, role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


def _create_and_send_otp(db: Session, user: User, purpose: str) -> str:
    otp_code = generate_otp_code()
    otp_hash = hash_otp_code(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=1)

    db.query(OTPCode).filter(OTPCode.user_id == user.id, OTPCode.purpose == purpose).delete()
    otp_record = OTPCode(
        user_id=user.id,
        email=user.email,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
        used=False,
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    if purpose == "verify_email":
        subject = "Verify your VoxForge AI account"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #f27d26;">VoxForge AI — Verify your email</h2>
            <p>Hi {user.name},</p>
            <p>Use the code below to verify your account:</p>
            <div style="background:#111; color:#fff; padding: 14px 18px; border-radius:8px; margin:16px 0; font-size:24px; letter-spacing:4px; text-align:center;">
                {otp_code}
            </div>
            <p>This code expires in 10 minutes.</p>
        </div>
        """
    else:
        subject = "Reset your VoxForge AI password"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #f27d26;">VoxForge AI — Password reset</h2>
            <p>Hi {user.name},</p>
            <p>Use the code below to reset your password:</p>
            <div style="background:#111; color:#fff; padding: 14px 18px; border-radius:8px; margin:16px 0; font-size:24px; letter-spacing:4px; text-align:center;">
                {otp_code}
            </div>
            <p>This code expires in 10 minutes.</p>
        </div>
        """

    send_email(user.email, subject, html_body, html_body.replace("<br>", "\n"))
    return otp_code


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
        is_active=True,
        email_verified=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    _create_and_send_otp(db, db_user, "verify_email")
    return {
        "message": "User registered successfully. Please verify your email with the OTP sent to your inbox.",
        "user_id": db_user.id,
        "email": db_user.email,
    }


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp_record = (
        db.query(OTPCode)
        .filter(OTPCode.user_id == user.id, OTPCode.purpose == "verify_email", OTPCode.used == False)
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    now = datetime.utcnow()
    if not otp_record or otp_record.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if not verify_otp_code(payload.otp, otp_record.otp_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    user.email_verified = True
    otp_record.used = True
    db.commit()
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    purpose = "forgot_password" if not user.email_verified else "verify_email"
    _create_and_send_otp(db, user, purpose)
    return MessageResponse(message="A new OTP has been sent")


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    settings = get_settings()
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_expires_days = settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS if credentials.remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, expires_delta=timedelta(days=refresh_expires_days))
    set_auth_cookie(response, access_token)
    set_refresh_cookie(response, refresh_token, refresh_expires_days)

    user.last_login = datetime.now(timezone.utc)
    user.remember_me = credentials.remember_me
    user.refresh_token_hash = hash_token(refresh_token)
    db.commit()

    return TokenResponse(access_token=access_token, token_type="bearer", user=_user_to_response(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    settings = get_settings()
    refresh_token_value = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    payload = verify_token(refresh_token_value)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.refresh_token_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid")
    if user.refresh_token_hash != hash_token(refresh_token_value):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid")

    new_access_token = create_access_token(data={"sub": str(user.id)})
    refresh_expires_days = settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS if user.remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)}, expires_delta=timedelta(days=refresh_expires_days))
    set_auth_cookie(response, new_access_token)
    set_refresh_cookie(response, new_refresh_token, refresh_expires_days)
    user.refresh_token_hash = hash_token(new_refresh_token)
    db.commit()

    return TokenResponse(access_token=new_access_token, token_type="bearer", user=_user_to_response(user))


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.refresh_token_hash = None
    db.commit()
    clear_auth_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return _user_to_response(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()
    return MessageResponse(message="Password changed successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    generic_response = MessageResponse(
        message="If an account with that email exists, a new OTP has been sent to it."
    )

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.info(f"Forgot-password requested for unknown email: {request.email}")
        return generic_response

    _create_and_send_otp(db, user, "forgot_password")
    return generic_response


@router.post("/verify-reset-otp", response_model=MessageResponse)
async def verify_reset_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp_record = (
        db.query(OTPCode)
        .filter(OTPCode.user_id == user.id, OTPCode.purpose == "forgot_password", OTPCode.used == False)
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    now = datetime.utcnow()
    if not otp_record or otp_record.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if not verify_otp_code(payload.otp, otp_record.otp_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    return MessageResponse(message="OTP verified successfully")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp_record = (
        db.query(OTPCode)
        .filter(OTPCode.user_id == user.id, OTPCode.purpose == "forgot_password", OTPCode.used == False)
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    now = datetime.utcnow()
    if not otp_record or otp_record.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if not verify_otp_code(payload.otp, otp_record.otp_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    user.password_hash = hash_password(payload.new_password)
    otp_record.used = True
    db.commit()
    return MessageResponse(message="Password reset successfully")