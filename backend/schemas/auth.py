"""
Authentication Schemas
Purpose: Pydantic models for authentication requests and responses (login, OTP, password change)
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """Registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3, max_length=50)
    encrypted_name: Optional[str] = Field(None, description="Auto-generated if not provided")
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Login request"""
    email: EmailStr
    password: str
    
    class Config:
        from_attributes = True


class OTPRequest(BaseModel):
    """Request OTP for login or password reset"""
    email: EmailStr
    purpose: str = Field(..., description="LOGIN or PASSWORD_RESET")
    
    class Config:
        from_attributes = True


class OTPVerify(BaseModel):
    """Verify OTP code"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field(..., description="EMAIL_VERIFICATION, LOGIN, or PASSWORD_RESET")
    
    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    """Change password using OTP"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    
    class Config:
        from_attributes = True


class PasswordChangeAuthenticated(BaseModel):
    """Change password when logged in"""
    old_password: str
    new_password: str = Field(..., min_length=8)
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response with access and refresh tokens"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int  # seconds
    user_id: int
    
    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    """Refresh access token using refresh token"""
    refresh_token: str
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """General auth response with message and token"""
    message: str
    token: Optional[TokenResponse] = None
    
    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """User session information"""
    id: int
    user_id: int
    expires_at: datetime
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
