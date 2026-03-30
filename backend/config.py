import os
from dotenv import load_dotenv

load_dotenv()

# MySQL Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "nust_social")
DB_PORT = int(os.getenv("DB_PORT", 3306))

# FastAPI Configuration
APP_TITLE = "NUST Social API"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Backend API for NUST Social Platform"
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))
JWT_REFRESH_EXPIRATION_DAYS = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", 30))

# OTP Configuration
OTP_EXPIRATION_MINUTES = int(os.getenv("OTP_EXPIRATION_MINUTES", 10))
OTP_LENGTH = 6
MAX_OTP_ATTEMPTS = 5

# Email Configuration (for sending OTP)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@nustsocial.com")

# Password Configuration
MIN_PASSWORD_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_DIGITS = True
PASSWORD_REQUIRE_SPECIAL = False

