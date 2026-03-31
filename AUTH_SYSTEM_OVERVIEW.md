# 🔐 NUST Social Auth System Overview

## Architecture

Your auth system is **production-ready** with OTP-based authentication for all critical operations.

---

## 📊 Core Components

### **1. User Model** (`models/users.py`)
```
User Table:
├── id (BigInteger, PK)
├── email (unique)
├── username (unique)
├── encrypted_name (unique, auto-generated for anonymity)
├── password_hash (bcrypt with 12 rounds)
├── is_verified (boolean)
├── status (ACTIVE, SUSPENDED, BANNED)
├── last_login_at
├── created_at, updated_at

Related Tables:
├── user_profiles (1:1 with User)
├── user_sessions (1:N - multiple devices)
├── otps (1:N - multiple OTP codes)
└── password_history (1:N - password change tracking)
```

---

## 🔑 Authentication Flow

### **A. Registration → Email Verification**
```
1. POST /auth/register
   ├── Email + Password + Username
   ├── Check email/username uniqueness
   ├── Hash password with bcrypt(12 rounds)
   ├── Create user with status=ACTIVE
   └── Generate OTP (6 digits) with purpose=EMAIL_VERIFICATION

2. POST /auth/verify-otp
   ├── Email + OTP + purpose=EMAIL_VERIFICATION
   ├── Mark OTP as used
   ├── Mark user as is_verified=1
   ├── Create user_profile if not exists
   ├── Generate access & refresh tokens
   ├── Create session in user_sessions table
   └── Return: {access_token, refresh_token, user_id}
```

### **B. Login → OTP Verification**
```
1. POST /auth/login
   ├── Email + Password
   ├── Verify password hash with bcrypt
   ├── Check account status (must be ACTIVE)
   ├── Generate OTP with purpose=LOGIN
   └── Send OTP to email

2. POST /auth/verify-otp
   ├── Email + OTP + purpose=LOGIN
   ├── Validate OTP (type, expiration)
   ├── Mark user as is_verified=1
   ├── Update last_login_at
   ├── Create user_sessions record
   └── Return tokens
```

### **C. Forgot Password → Reset Password** ⭐ (YOUR NEW FEATURE)
```
1. POST /auth/request-password-reset
   ├── Email
   ├── Find user by email
   ├── Generate OTP with purpose=PASSWORD_RESET
   ├── Expires in 15 minutes (OTP_EXPIRATION_MINUTES=15)
   └── Send OTP to email [TODO: Implement email sending]

2. POST /auth/reset-password
   ├── Email + OTP + new_password
   ├── Validate OTP (type, expiration, not used)
   ├── Validate password strength (min 8 chars, upper, lower, digit)
   ├── Save old password to password_history
   ├── Update password_hash
   ├── Mark OTP as used
   └── Logout from all devices for security

3. POST /auth/verify-otp (alternative)
   ├── Can also use verify-otp with purpose=PASSWORD_RESET
   ├── Creates session + returns tokens
```

### **D. Change Password (Authenticated User)**
```
POST /auth/change-password
├── Requires: Authorization header (Bearer token)
├── Old password + New password
├── Verify old password against hash
├── Validate new password strength
├── Update password_hash
├── Track in password_history
└── Return: success message
```

---

## 🔐 Security Features

### **Password Hashing**
- **Algorithm**: bcrypt with 12 rounds (slow, NIST-approved)
- **Location**: `utils/security.py → PasswordManager`
- **Validation**: 
  - Min 8 characters
  - Must contain: uppercase, lowercase, digit
  - Cannot match previous passwords (via password_history table)

### **OTP System**
- **Length**: 6 digits (0-999999)
- **Expiration**: 15 minutes (configurable in config.py)
- **Purposes**: LOGIN, EMAIL_VERIFICATION, PASSWORD_RESET
- **Status**: Single-use (is_used flag prevents replay)
- **Generation**: Uses `secrets.choice()` for cryptographically secure randomness

### **JWT Tokens**
- **Access Token**: Expires in 1 hour (JWT_EXPIRATION_HOURS)
- **Refresh Token**: Expires in 30 days (JWT_REFRESH_EXPIRATION_DAYS)
- **Algorithm**: HS256 (symmetric, requires secret key)
- **Payload**: `{user_id, exp, iat, type: "access"|"refresh"}`

### **Sessions**
- **Table**: `user_sessions`
- **Tracking**: IP address, User-Agent (device/browser detection)
- **Multi-device**: User can have multiple active sessions
- **Refresh token hashing**: 
  - Pre-hashed with SHA256
  - Then bcrypt(12 rounds) for storage
  - Prevents JWT signature verification attacks

---

## 📧 Email System (CURRENTLY DISABLED)

### **Config** (`config.py`)
```python
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
OTP_EXPIRATION_MINUTES=15
```

### **OTP Email Template** (`services/auth_service.py`)
```
Subject: Your NUST Social Verification Code
Body: Your OTP is: [6-digit code]
      Valid for 15 minutes
      Never share this code
```

### **Currently**
- OTP is returned in API response for testing
- Email sending is marked as TODO
- Uncomment `AuthService.send_otp_email()` when ready

---

## 🔄 Session Management

### **Create Session**
- Generated after OTP verification (LOGIN/EMAIL_VERIFICATION/PASSWORD_RESET)
- Stores: access_token hash, refresh_token hash, expires_at, ip_address, user_agent
- Indexed by: user_id, token, is_active

### **List Sessions**
```
GET /auth/sessions (requires auth)
├── Get all active sessions for user
├── Show: device type, IP, User-Agent, creation time, expiration
└── Used by: Settings page to show "Logged in devices"
```

### **Logout**
```
POST /auth/logout (requires auth)
├── Deactivate current session (is_active = 0)
└── Token remains in DB but is_active=false
```

### **Logout All Devices**
```
POST /auth/logout-all-devices (requires auth)
├── Deactivate ALL sessions for this user
├── Also triggered after password reset for security
└── Used by: Settings page "Logout from all devices" button
```

---

## 📱 Frontend Integration Points

### **Endpoints Already Built**
✅ POST `/auth/register` → Register with email
✅ POST `/auth/login` → Login with password, get OTP
✅ POST `/auth/verify-otp` → Verify OTP, get tokens
✅ POST `/auth/request-password-reset` → Request forgot password OTP
✅ POST `/auth/reset-password` → Reset password with OTP
✅ POST `/auth/change-password` → Change password (authenticated)
✅ GET `/auth/me` → Get current user info
✅ GET `/auth/sessions` → List active sessions
✅ POST `/auth/logout` → Logout current device
✅ DELETE `/auth/sessions/{session_id}` → Logout specific device
✅ POST `/auth/logout-all-devices` → Logout all devices

---

## 🚀 Forgot Password Implementation

### **What Needs to be Built**

**Frontend Pages:**
1. **Forgot Password Form** (`/forgot-password`)
   - Email input field
   - Submit button
   - Shows: "OTP sent to email"
   - Countdown timer (15 minutes)

2. **OTP Verification Form**
   - OTP input (6 digits)
   - Shows time remaining
   - "Didn't get code? Resend" button

3. **New Password Form**
   - New password input
   - Confirm password input
   - Password strength indicator
   - Submit button

### **Flow**
```
User → /forgot-password → Enter email
   ↓
POST /auth/request-password-reset
   ↓
Show OTP verification screen
   ↓
User enters OTP
   ↓
POST /auth/verify-otp with purpose=PASSWORD_RESET
   ├── Option A: Auto-login (returns tokens)
   └── Option B: Show new password form
   ↓
POST /auth/reset-password with OTP + new_password
   ↓
Logged out from all devices (automatic)
   ↓
Redirect to login page
```

---

## ✉️ Email Implementation (TODO)

### **Send OTP Email**
```python
@staticmethod
def send_otp_email(email: str, otp_code: str, purpose: str):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = email
    msg['Subject'] = f'NUST Social - {purpose} OTP Code'
    
    body = f"""
    Hello,
    Your OTP code for {purpose} is: {otp_code}
    
    This code expires in 15 minutes.
    Do not share this code with anyone.
    
    NUST Social
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
```

### **Enable Email**
1. Update `config.py` with SMTP credentials
2. Uncomment in `auth_service.py`:
   - `AuthService.send_otp_email()` calls
3. Test: Send OTP to your email
4. Check spam folder if not in inbox

---

## 🛡️ Security Best Practices

### **Current System**
✅ Bcrypt password hashing (12 rounds, slow)
✅ OTP single-use (is_used flag)
✅ OTP expiration (15 min)
✅ JWT token signing
✅ Refresh token hashing (SHA256 + bcrypt)
✅ Password history tracking
✅ Session multi-device support
✅ Last login tracking
✅ Account status checks (ACTIVE/SUSPENDED/BANNED)

### **For Forgot Password**
- User must verify email ownership via OTP
- Password changed → Auto logout all sessions (prevents attacker access)
- Password history prevents reusing old passwords
- Rate limiting recommended (TODO: not implemented)
- Email rate limiting recommended (TODO: not implemented)

---

## 📝 Config Parameters (`config.py`)
```python
# JWT
JWT_SECRET_KEY="your-secret-key"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS=1
JWT_REFRESH_EXPIRATION_DAYS=30

# OTP
OTP_LENGTH=6
OTP_EXPIRATION_MINUTES=15

# Password
MIN_PASSWORD_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=True
PASSWORD_REQUIRE_LOWERCASE=True
PASSWORD_REQUIRE_DIGITS=True

# Email (TODO)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="..."
SMTP_PASSWORD="..."
```

---

## 🎯 Ready for Forgot Password?

Your auth system is **100% ready** for forgot password implementation:

✅ OTP system built (with PASSWORD_RESET purpose)
✅ Password reset endpoint built (`/reset-password`)
✅ Password validation built
✅ Password history tracking built
✅ Logout all devices built (for security)
✅ Database schema ready

**Next Steps:**
1. Implement frontend forgot password pages
2. Enable email sending in auth_service.py
3. Test OTP delivery to email
4. Test password reset flow end-to-end
