"""
Validators Utility
Purpose: Custom validation functions for inputs and data constraints
"""

import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_username(username: str) -> bool:
    """Validate username format (alphanumeric and underscore, 3-50 chars)"""
    pattern = r'^[a-zA-Z0-9_]{3,50}$'
    return re.match(pattern, username) is not None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    return True, "Password is strong"


def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    pattern = r'^\+?1?\d{9,15}$'
    return re.match(pattern, phone.replace(' ', '').replace('-', '')) is not None


def validate_batch_year(year: int) -> bool:
    """Validate batch year"""
    return 1990 <= year <= 2100


def validate_price(price: float) -> bool:
    """Validate product/ticket price"""
    return price >= 0


def validate_stock(stock: int) -> bool:
    """Validate product stock quantity"""
    return stock >= 0
