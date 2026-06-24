"""Authentication schemas"""
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """User registration request"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response (public data)"""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
