"""
Authentication Service
Purpose: Business logic for user registration, login, OTP verification, password reset, and session management
Uses raw MySQL queries with SQLAlchemy's text() for direct SQL execution
"""

import smtplib
import uuid
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from config import (
    SMTP_SERVER,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    OTP_EXPIRATION_MINUTES,
    MAX_OTP_ATTEMPTS,
)
from utils.security import PasswordManager, JWTManager, OTPManager, TokenManager


class AuthService:
    """Handle authentication and session management"""
    
    @staticmethod
    def generate_encrypted_name(email: str, username: str) -> str:
        """
        Generate a unique encrypted name from email and username
        Uses uuid and hash for uniqueness and encryption
        """
        unique_value = f"{email}_{username}_{uuid.uuid4()}"
        encrypted = hashlib.sha256(unique_value.encode()).hexdigest()
        return encrypted[:32]  # Return first 32 chars
    
    @staticmethod
    def register_user(
        db: Session,
        email: str,
        password: str,
        username: str,
        encrypted_name: Optional[str] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Register new user. Creates user with email verification OTP
        Returns: (success, message, user_data)
        """
        try:
            # Check if email already exists
            result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if result:
                return False, "Email already registered", None
            
            # Check if username already exists
            result = db.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": username}
            ).fetchone()
            
            if result:
                return False, "Username already taken", None
            
            # ALWAYS auto-generate encrypted_name for anonymity and uniqueness
            # Never use user input for encrypted_name
            encrypted_name = AuthService.generate_encrypted_name(email, username)
            
            # Validate password strength
            is_valid, msg = PasswordManager.validate_password_strength(password)
            if not is_valid:
                return False, msg, None
            
            # Hash password
            password_hash = PasswordManager.hash_password(password)
            
            # Create user with ACTIVE status
            db.execute(
                text("""
                    INSERT INTO users (email, encrypted_name, username, password_hash, status, created_at)
                    VALUES (:email, :encrypted_name, :username, :password_hash, 'ACTIVE', NOW())
                """),
                {
                    "email": email,
                    "encrypted_name": encrypted_name,
                    "username": username,
                    "password_hash": password_hash
                }
            )
            db.flush()
            
            # Get user ID
            user_result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            user_id = user_result[0]
            
            # Generate OTP
            otp_code = OTPManager.generate_otp()
            otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
            
            # Insert OTP
            db.execute(
                text("""
                    INSERT INTO otps (user_id, email, otp_code, purpose, expires_at, is_used, created_at)
                    VALUES (:user_id, :email, :otp_code, :purpose, :expires_at, 0, NOW())
                """),
                {
                    "user_id": user_id,
                    "email": email,
                    "otp_code": otp_code,
                    "purpose": "EMAIL_VERIFICATION",
                    "expires_at": otp_expires
                }
            )
            db.commit()
            
            # TODO: Send OTP email
            # DISABLED FOR TESTING - Uncomment below when email service is ready
            # AuthService.send_otp_email(email, otp_code, "Email Verification")
            
            return True, f"Registration successful. OTP for testing: {otp_code}", {
                "user_id": user_id,
                "email": email
            }
        except Exception as e:
            db.rollback()
            return False, f"Registration failed: {str(e)}", None
    
    @staticmethod
    def login_with_password(
        db: Session,
        email: str,
        password: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Login user with email and password. Generates OTP for verification
        Returns: (success, message, data)
        """
        try:
            # Find user
            user_result = db.execute(
                text("SELECT id, password_hash, status FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                return False, "Invalid email or password", None
            
            user_id, password_hash, status = user_result
            
            if status != 'ACTIVE':
                return False, "Account is disabled or banned", None
            
            # Verify password
            if not PasswordManager.verify_password(password, password_hash):
                return False, "Invalid email or password", None
            
            # Generate OTP
            otp_code = OTPManager.generate_otp()
            otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
            
            # Insert OTP
            db.execute(
                text("""
                    INSERT INTO otps (user_id, email, otp_code, purpose, expires_at, is_used, created_at)
                    VALUES (:user_id, :email, :otp_code, :purpose, :expires_at, 0, NOW())
                """),
                {
                    "user_id": user_id,
                    "email": email,
                    "otp_code": otp_code,
                    "purpose": "LOGIN",
                    "expires_at": otp_expires
                }
            )
            db.commit()
            
            # TODO: Send OTP email
            # DISABLED FOR TESTING - Uncomment below when email service is ready
            # AuthService.send_otp_email(email, otp_code, "Login Verification")
            
            return True, f"OTP for testing: {otp_code}. Please verify to complete login.", {
                "user_id": user_id,
                "email": email,
                "otp_expires_in": OTP_EXPIRATION_MINUTES * 60  # seconds
            }
        except Exception as e:
            db.rollback()
            return False, f"Login failed: {str(e)}", None
    
    @staticmethod
    def verify_otp_and_create_session(
        db: Session,
        email: str,
        otp_code: str,
        purpose: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Verify OTP and create session with tokens (for LOGIN/PASSWORD_RESET)
        Or verify email and mark user as verified (for EMAIL_VERIFICATION)
        Returns: (success, message, token_data)
        """
        try:
            # Find user
            user_result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                return False, "User not found", None
            
            user_id = user_result[0]
            
            # Find valid OTP
            otp_result = db.execute(
                text("""
                    SELECT id, expires_at FROM otps 
                    WHERE user_id = :user_id AND otp_code = :otp_code 
                    AND purpose = :purpose AND is_used = 0
                """),
                {"user_id": user_id, "otp_code": otp_code, "purpose": purpose}
            ).fetchone()
            
            if not otp_result:
                return False, "Invalid OTP", None
            
            otp_id, expires_at = otp_result
            
            # Check if OTP expired
            if OTPManager.is_otp_expired(expires_at):
                return False, "OTP has expired", None
            
            # Mark OTP as used
            db.execute(
                text("UPDATE otps SET is_used = 1 WHERE id = :id"),
                {"id": otp_id}
            )
            
            # Handle EMAIL_VERIFICATION purpose
            if purpose == "EMAIL_VERIFICATION":
                # Mark user as verified
                db.execute(
                    text("UPDATE users SET is_verified = 1 WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                
                # Get user details
                user_details = db.execute(
                    text("SELECT username FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()
                
                username = user_details[0] if user_details else None
                
                # Check if user_profile already exists
                profile_check = db.execute(
                    text("SELECT user_id FROM user_profiles WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()
                
                # If profile doesn't exist, create it
                if not profile_check:
                    db.execute(
                        text("""
                            INSERT INTO user_profiles (user_id, created_at, updated_at)
                            VALUES (:user_id, NOW(), NOW())
                        """),
                        {"user_id": user_id}
                    )
                
                # Create tokens and session for EMAIL_VERIFICATION
                tokens = TokenManager.create_session_tokens(user_id)
                
                # Hash refresh token before storing
                refresh_token_hash = PasswordManager.hash_refresh_token(tokens["refresh_token"])
                
                # Create session in database
                session_expires = datetime.utcnow() + timedelta(hours=24)
                refresh_expires = datetime.utcnow() + timedelta(days=30)
                
                db.execute(
                    text("""
                        INSERT INTO user_sessions 
                        (user_id, token, refresh_token, expires_at, refresh_expires_at, is_active, ip_address, user_agent, created_at)
                        VALUES (:user_id, :token, :refresh_token, :expires_at, :refresh_expires_at, 1, :ip_address, :user_agent, NOW())
                    """),
                    {
                        "user_id": user_id,
                        "token": tokens["access_token"],
                        "refresh_token": refresh_token_hash,
                        "expires_at": session_expires,
                        "refresh_expires_at": refresh_expires,
                        "ip_address": ip_address,
                        "user_agent": user_agent
                    }
                )
                
                db.commit()
                
                return True, "Email verified successfully. You can now use the app.", tokens
            
            # Handle LOGIN purpose - also mark user as verified
            if purpose == "LOGIN":
                db.execute(
                    text("UPDATE users SET is_verified = 1 WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                
                # Get user details
                user_details = db.execute(
                    text("SELECT username FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()
                
                username = user_details[0] if user_details else None
                
                # Check if user_profile already exists
                profile_check = db.execute(
                    text("SELECT user_id FROM user_profiles WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()
                
                # If profile doesn't exist, create it
                if not profile_check:
                    db.execute(
                        text("""
                            INSERT INTO user_profiles (user_id, created_at, updated_at)
                            VALUES (:user_id, NOW(), NOW())
                        """),
                        {"user_id": user_id}
                    )
            
            # Create tokens for LOGIN and PASSWORD_RESET
            tokens = TokenManager.create_session_tokens(user_id)
            
            # Hash refresh token before storing
            refresh_token_hash = PasswordManager.hash_refresh_token(tokens["refresh_token"])
            
            # Create session in database
            session_expires = datetime.utcnow() + timedelta(hours=24)
            refresh_expires = datetime.utcnow() + timedelta(days=30)
            
            db.execute(
                text("""
                    INSERT INTO user_sessions 
                    (user_id, token, refresh_token, expires_at, refresh_expires_at, is_active, ip_address, user_agent, created_at)
                    VALUES (:user_id, :token, :refresh_token, :expires_at, :refresh_expires_at, 1, :ip_address, :user_agent, NOW())
                """),
                {
                    "user_id": user_id,
                    "token": tokens["access_token"],
                    "refresh_token": refresh_token_hash,
                    "expires_at": session_expires,
                    "refresh_expires_at": refresh_expires,
                    "ip_address": ip_address,
                    "user_agent": user_agent
                }
            )
            
            # Update user last login
            db.execute(
                text("UPDATE users SET last_login_at = NOW() WHERE id = :user_id"),
                {"user_id": user_id}
            )
            
            db.commit()
            
            return True, "Login successful", tokens
        except Exception as e:
            db.rollback()
            return False, f"Session creation failed: {str(e)}", None
    
    @staticmethod
    def request_password_reset(
        db: Session,
        email: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Request password reset. Sends OTP to email
        Returns: (success, message, data)
        """
        try:
            # Find user
            user_result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                # Don't reveal if email exists for security
                return True, "If email exists, OTP will be sent", None
            
            user_id = user_result[0]
            
            # Generate OTP
            otp_code = OTPManager.generate_otp()
            otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
            
            # Insert OTP
            db.execute(
                text("""
                    INSERT INTO otps (user_id, email, otp_code, purpose, expires_at, is_used, created_at)
                    VALUES (:user_id, :email, :otp_code, :purpose, :expires_at, 0, NOW())
                """),
                {
                    "user_id": user_id,
                    "email": email,
                    "otp_code": otp_code,
                    "purpose": "PASSWORD_RESET",
                    "expires_at": otp_expires
                }
            )
            db.commit()
            
            # TODO: Send OTP email
            # DISABLED FOR TESTING - Uncomment below when email service is ready
            # AuthService.send_otp_email(email, otp_code, "Password Reset")
            
            return True, f"OTP for testing: {otp_code}. Use this to reset your password.", {
                "email": email,
                "otp_expires_in": OTP_EXPIRATION_MINUTES * 60
            }
        except Exception as e:
            db.rollback()
            return False, f"Password reset request failed: {str(e)}", None
    
    @staticmethod
    def reset_password_with_otp(
        db: Session,
        email: str,
        otp_code: str,
        new_password: str
    ) -> Tuple[bool, str, None]:
        """
        Reset password using OTP verification
        Returns: (success, message, None)
        """
        try:
            # Find user
            user_result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                return False, "User not found", None
            
            user_id = user_result[0]
            
            # Find valid password reset OTP
            otp_result = db.execute(
                text("""
                    SELECT id, expires_at FROM otps 
                    WHERE user_id = :user_id AND otp_code = :otp_code 
                    AND purpose = 'PASSWORD_RESET' AND is_used = 0
                """),
                {"user_id": user_id, "otp_code": otp_code}
            ).fetchone()
            
            if not otp_result:
                return False, "Invalid OTP", None
            
            otp_id, expires_at = otp_result
            
            # Check if OTP expired
            if OTPManager.is_otp_expired(expires_at):
                return False, "OTP has expired", None
            
            # Validate new password
            is_valid, msg = PasswordManager.validate_password_strength(new_password)
            if not is_valid:
                return False, msg, None
            
            # Mark OTP as used
            db.execute(
                text("UPDATE otps SET is_used = 1 WHERE id = :id"),
                {"id": otp_id}
            )
            
            # Get old password hash
            old_hash_result = db.execute(
                text("SELECT password_hash FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if old_hash_result:
                old_hash = old_hash_result[0]
                # Store in password history
                db.execute(
                    text("""
                        INSERT INTO password_history (user_id, old_password_hash, changed_at)
                        VALUES (:user_id, :old_password_hash, NOW())
                    """),
                    {"user_id": user_id, "old_password_hash": old_hash}
                )
            
            # Hash and update new password
            password_hash = PasswordManager.hash_password(new_password)
            db.execute(
                text("UPDATE users SET password_hash = :password_hash WHERE id = :user_id"),
                {"password_hash": password_hash, "user_id": user_id}
            )
            
            db.commit()
            
            return True, "Password reset successful", None
        except Exception as e:
            db.rollback()
            return False, f"Password reset failed: {str(e)}", None
    
    @staticmethod
    def change_password_authenticated(
        db: Session,
        user_id: int,
        old_password: str,
        new_password: str
    ) -> Tuple[bool, str, None]:
        """
        Change password for authenticated user
        Returns: (success, message, None)
        """
        try:
            # Find user
            user_result = db.execute(
                text("SELECT password_hash FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if not user_result:
                return False, "User not found", None
            
            password_hash = user_result[0]
            
            # Verify old password
            if not PasswordManager.verify_password(old_password, password_hash):
                return False, "Current password is incorrect", None
            
            # Validate new password
            is_valid, msg = PasswordManager.validate_password_strength(new_password)
            if not is_valid:
                return False, msg, None
            
            # Store old password in history
            db.execute(
                text("""
                    INSERT INTO password_history (user_id, old_password_hash, changed_at)
                    VALUES (:user_id, :old_password_hash, NOW())
                """),
                {"user_id": user_id, "old_password_hash": password_hash}
            )
            
            # Hash and update new password
            new_hash = PasswordManager.hash_password(new_password)
            db.execute(
                text("UPDATE users SET password_hash = :password_hash WHERE id = :user_id"),
                {"password_hash": new_hash, "user_id": user_id}
            )
            
            db.commit()
            
            return True, "Password changed successfully", None
        except Exception as e:
            db.rollback()
            return False, f"Password change failed: {str(e)}", None
    
    @staticmethod
    def refresh_access_token(
        db: Session,
        refresh_token: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Generate new access and refresh tokens using refresh token (with rotation)
        
        THREE Strict Conditions MUST be met:
        1. Session exists and is_active = 1
        2. stored_refresh_hash is not null/empty
        3. bcrypt.checkpw(incoming_token, stored_hash) == TRUE
        
        If ALL three pass:
        - Generate new tokens
        - Hash new refresh token
        - REPLACE old hash with new hash in database
        - Old refresh token becomes invalid immediately
        
        Returns: (success, message, new_token_data)
        """
        try:
            # === CONDITION 1: Verify incoming refresh token JWT ===
            decoded = JWTManager.decode_token(refresh_token)
            if decoded is None:
                return False, "Token invalid or expired", None
            
            if decoded.get("type") != "refresh":
                return False, "Not a refresh token", None
            
            user_id = decoded.get("user_id")
            if not user_id:
                return False, "Invalid token payload", None
            
            # === CONDITION 1: Find ALL active sessions for user ===
            session_results = db.execute(
                text("""
                    SELECT id, refresh_expires_at, refresh_token, is_active
                    FROM user_sessions 
                    WHERE user_id = :user_id AND is_active = 1
                """),
                {"user_id": user_id}
            ).fetchall()
            
            if not session_results:
                return False, "No active session found", None
            
            # === CONDITION 2 & 3: Find session with matching hash ===
            matching_session_id = None
            matching_refresh_expires = None
            hash_verification_attempted = False
            hash_verification_passed = False
            
            for session in session_results:
                session_id, refresh_expires_at, stored_refresh_hash, is_active = session
                
                # CONDITION 1: Must be active
                if not is_active:
                    continue
                
                # CONDITION 2: Must have stored hash
                if not stored_refresh_hash or stored_refresh_hash.strip() == "":
                    continue
                
                # CONDITION 3: Hash must match using bcrypt
                hash_verification_attempted = True
                try:
                    # Use bcrypt to verify - this is the CRITICAL check
                    verify_result = PasswordManager.verify_refresh_token(refresh_token, stored_refresh_hash)
                    
                    if verify_result:
                        # Token matches this session's hash
                        hash_verification_passed = True
                        
                        # Check expiration
                        if datetime.utcnow() > refresh_expires_at:
                            return False, "Refresh token expired", None
                        
                        # Found matching session!
                        matching_session_id = session_id
                        matching_refresh_expires = refresh_expires_at
                        break
                except Exception:
                    # Hash format invalid, try next session
                    continue
            
            # If no match found - REJECT
            if not matching_session_id:
                if hash_verification_attempted and not hash_verification_passed:
                    # Hash didn't match - possible reuse/theft
                    return False, "Token mismatch", None
                else:
                    # No valid hash found in any session
                    return False, "Invalid token", None
            
            # === GENERATE NEW TOKENS ===
            new_tokens = TokenManager.create_session_tokens(user_id)
            new_access_token = new_tokens["access_token"]
            new_refresh_token = new_tokens["refresh_token"]
            
            # === HASH NEW REFRESH TOKEN ===
            new_refresh_token_hash = PasswordManager.hash_refresh_token(new_refresh_token)
            
            # Set new expiration times
            new_access_expires = datetime.utcnow() + timedelta(hours=24)
            new_refresh_expires = datetime.utcnow() + timedelta(days=30)
            
            # === REPLACE OLD HASH WITH NEW HASH ===
            try:
                update_result = db.execute(
                    text("""
                        UPDATE user_sessions 
                        SET token = :new_access_token, 
                            refresh_token = :new_refresh_token_hash, 
                            expires_at = :new_access_expires, 
                            refresh_expires_at = :new_refresh_expires,
                            updated_at = NOW()
                        WHERE id = :session_id 
                            AND user_id = :user_id 
                            AND is_active = 1
                    """),
                    {
                        "new_access_token": new_access_token,
                        "new_refresh_token_hash": new_refresh_token_hash,
                        "new_access_expires": new_access_expires,
                        "new_refresh_expires": new_refresh_expires,
                        "session_id": matching_session_id,
                        "user_id": user_id
                    }
                )
                
                db.commit()
                
                # Verify the update actually happened
                if update_result.rowcount != 1:
                    db.rollback()
                    return False, "Database update failed", None
                    
            except Exception as db_error:
                db.rollback()
                return False, f"Update error: {str(db_error)}", None
            
            # === SUCCESS: Return new tokens ===
            # OLD refresh token is now useless (hash was replaced)
            # Next refresh attempt with old token will fail
            return True, "Tokens rotated successfully", {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer",
                "expires_in": 86400
            }
            
        except Exception as e:
            db.rollback()
            return False, f"Refresh failed: {str(e)}", None
    
    @staticmethod
    def logout(
        db: Session,
        user_id: int,
        token: str
    ) -> Tuple[bool, str, None]:
        """
        Logout user by deactivating session (both access and refresh tokens)
        Returns: (success, message, None)
        """
        try:
            # Find and deactivate session - invalidates both access and refresh tokens
            session_result = db.execute(
                text("""
                    SELECT id, refresh_token FROM user_sessions 
                    WHERE user_id = :user_id AND token = :token AND is_active = 1
                """),
                {"user_id": user_id, "token": token}
            ).fetchone()
            
            if session_result:
                session_id = session_result[0]
                # Set is_active to FALSE to invalidate BOTH access and refresh tokens
                db.execute(
                    text("UPDATE user_sessions SET is_active = 0 WHERE id = :id"),
                    {"id": session_id}
                )
                db.commit()
                return True, "Logged out successfully. Access token and refresh token are now invalid.", None
            
            return False, "Session not found or already logged out", None
        except Exception as e:
            db.rollback()
            return False, f"Logout failed: {str(e)}", None
    
    @staticmethod
    def logout_all_devices(
        db: Session,
        user_id: int
    ) -> Tuple[bool, str, int]:
        """
        Logout user from all devices by deactivating all sessions
        Returns: (success, message, sessions_deactivated_count)
        """
        try:
            # Get count of active sessions
            count_result = db.execute(
                text("SELECT COUNT(*) FROM user_sessions WHERE user_id = :user_id AND is_active = 1"),
                {"user_id": user_id}
            ).scalar()
            
            # Deactivate all sessions
            db.execute(
                text("UPDATE user_sessions SET is_active = 0 WHERE user_id = :user_id AND is_active = 1"),
                {"user_id": user_id}
            )
            db.commit()
            
            if count_result > 0:
                return True, f"Logged out from all {count_result} device(s). All sessions are now invalid.", count_result
            else:
                return True, "No active sessions found.", 0
        except Exception as e:
            db.rollback()
            return False, f"Logout from all devices failed: {str(e)}", 0
    
    @staticmethod
    def get_active_sessions(
        db: Session,
        user_id: int
    ) -> list:
        """Get all active sessions for user"""
        sessions = db.execute(
            text("""
                SELECT id, user_id, expires_at, is_active, created_at, ip_address, user_agent
                FROM user_sessions 
                WHERE user_id = :user_id AND is_active = 1
            """),
            {"user_id": user_id}
        ).fetchall()
        
        return sessions
    
    @staticmethod
    def send_otp_email(email: str, otp_code: str, purpose: str = "Verification") -> bool:
        """
        Send OTP to user's email
        Returns: success status
        """
        try:
            # Prepare email
            subject = f"Your {purpose} Code"
            body = f"""
Hello,

Your {purpose} Code is: {otp_code}

This code is valid for 10 minutes.

If you did not request this, please ignore this email.

Best regards,
NUST Social Team
            """
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = SMTP_USERNAME
            message["To"] = email
            
            # Attach plain text
            text_part = MIMEText(body, "plain")
            message.attach(text_part)
            
            # Send email
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_USERNAME, email, message.as_string())
            
            return True
        except Exception as e:
            print(f"Failed to send OTP email: {str(e)}")
            return False
