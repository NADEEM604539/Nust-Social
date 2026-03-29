"""
Security Utilities
Purpose: Password hashing, JWT token generation/validation, OTP generation, and password strength validation
"""

import bcrypt
import jwt
import secrets
import string
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_EXPIRATION_HOURS,
    JWT_REFRESH_EXPIRATION_DAYS,
    OTP_LENGTH,
    MIN_PASSWORD_LENGTH,
    PASSWORD_REQUIRE_UPPERCASE,
    PASSWORD_REQUIRE_LOWERCASE,  
    PASSWORD_REQUIRE_DIGITS,
)


class PasswordManager:
    """Manage password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength based on config requirements
        Returns: (is_valid, message)
        """
        if len(password) < MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
        
        if PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if PASSWORD_REQUIRE_DIGITS and not any(c.isdigit() for c in password):
            return False, "Password must contain at least one digit"
        
        return True, "Password is valid"
    
    @staticmethod
    def hash_refresh_token(refresh_token: str) -> str:
        """Hash refresh token using bcrypt (12 rounds)"""
        # Pre-hash with SHA-256 to bypass bcrypt's 72-byte truncation limit
        # JWT tokens are long and start with identical headers/payloads
        pre_hash = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(pre_hash.encode('utf-8'), salt)
        # Return as string (bcrypt format string, not UTF-8 encoded bytes)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_refresh_token(refresh_token: str, refresh_token_hash: str) -> bool:
        """Verify refresh token against bcrypt hash"""
        try:
            # Pre-hash the incoming token to match the storage mechanism
            pre_hash = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
            # Convert hash string back to bytes in bcrypt format
            hash_bytes = refresh_token_hash.encode('utf-8')
            # Verify token
            return bcrypt.checkpw(pre_hash.encode('utf-8'), hash_bytes)
        except Exception:
            # If hash format is invalid, return False
            return False


class JWTManager:
    """Manage JWT token creation and validation"""
    
    @staticmethod
    def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> tuple[str, int]:
        """
        Create JWT access token
        Returns: (token, expires_in_seconds)
        """
        if expires_delta is None:
            expires_delta = timedelta(hours=JWT_EXPIRATION_HOURS)
        
        expire = datetime.utcnow() + expires_delta
        payload = {
            "user_id": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        expires_in = int(expires_delta.total_seconds())
        
        return token, expires_in
    
    @staticmethod
    def create_refresh_token(user_id: int) -> tuple[str, int]:
        """
        Create JWT refresh token
        Returns: (token, expires_in_seconds)
        """
        expires_delta = timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
        expire = datetime.utcnow() + expires_delta
        payload = {
            "user_id": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        expires_in = int(expires_delta.total_seconds())
        
        return token, expires_in
    
    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Decode and validate JWT token
        Returns: payload dict or None if invalid
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def verify_token_type(token: str, expected_type: str) -> bool:
        """Verify token is of expected type (access or refresh)"""
        payload = JWTManager.decode_token(token)
        if payload is None:
            return False
        return payload.get("type") == expected_type
    
    @staticmethod
    def get_user_id_from_token(token: str) -> Optional[int]:
        """Extract user_id from token if valid"""
        payload = JWTManager.decode_token(token)
        if payload is None:
            return None
        return payload.get("user_id")


class OTPManager:
    """Manage OTP generation and validation"""
    
    @staticmethod
    def generate_otp() -> str:
        """Generate random 6-digit OTP"""
        digits = string.digits
        otp = ''.join(secrets.choice(digits) for _ in range(OTP_LENGTH))
        return otp
    
    @staticmethod
    def is_otp_valid(otp_code: str) -> bool:
        """Check if OTP code format is valid (6 digits)"""
        return len(otp_code) == OTP_LENGTH and otp_code.isdigit()
    
    @staticmethod
    def is_otp_expired(expires_at: datetime) -> bool:
        """Check if OTP has expired"""
        return datetime.utcnow() > expires_at


class TokenManager:
    """Manage session creation and token refresh logic"""
    
    @staticmethod
    def create_session_tokens(user_id: int) -> Dict[str, Any]:
        """
        Create access and refresh tokens for new session
        Returns: dict with access_token, refresh_token, expires_in, user_id
        """
        access_token, access_expires = JWTManager.create_access_token(user_id)
        refresh_token, refresh_expires = JWTManager.create_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": access_expires,
            "user_id": user_id,
            "refresh_token_expires_in": refresh_expires
        }
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Create new access token from refresh token
        Returns: dict with new access_token and expires_in, or None if invalid
        """
        # Verify it's a refresh token
        if not JWTManager.verify_token_type(refresh_token, "refresh"):
            return None
        
        # Get user_id from token
        user_id = JWTManager.get_user_id_from_token(refresh_token)
        if user_id is None:
            return None
        
        # Create new access token
        access_token, expires_in = JWTManager.create_access_token(user_id)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "user_id": user_id
        }
