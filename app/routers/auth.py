from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    PasswordChange, ForgotPasswordRequest, MessageResponse,
)
from ..utils.security import (
    hash_password, verify_password, create_access_token, get_current_user,
    set_auth_cookie, clear_auth_cookie, generate_temp_password,
)
from ..utils.email import send_new_password_email
from ..config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id, name=user.name, email=user.email, role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user = User(
        name=user_data.name, email=user_data.email,
        password_hash=hash_password(user_data.password), role="user", is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered successfully", "user_id": db_user.id, "email": db_user.email}


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    access_token = create_access_token(data={"sub": str(user.id)})
    set_auth_cookie(response, access_token)

    return TokenResponse(access_token=access_token, token_type="bearer", user=_user_to_response(user))


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
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
    """Generates a new random password, saves its hash, and emails it.
    Always returns the same generic message so this can't be used to
    discover which emails are registered."""
    settings = get_settings()
    generic_response = MessageResponse(
        message="If an account with that email exists, a new password has been sent to it."
    )

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.info(f"Forgot-password requested for unknown email: {request.email}")
        return generic_response

    new_password = generate_temp_password(settings.TEMP_PASSWORD_LENGTH)
    user.password_hash = hash_password(new_password)
    db.commit()

    email_sent = send_new_password_email(user.email, user.name, new_password)
    if not email_sent:
        logger.warning(
            f"Could not email new password to {user.email}. "
            f"[DEV ONLY] New password: {new_password}"
        )

    return generic_response