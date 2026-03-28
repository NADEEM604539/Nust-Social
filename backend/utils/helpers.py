"""
Helpers Utility
Purpose: General helper functions for common operations and data processing
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any


def paginate(items: List[Any], skip: int, limit: int) -> List[Any]:
    """
    Paginate a list of items
    """
    return items[skip : skip + limit]


def get_pagination_params(skip: int = 0, limit: int = 20) -> tuple:
    """Generate pagination parameters with validation"""
    skip = max(0, skip)
    limit = min(max(1, limit), 100)  # Limit between 1-100
    return skip, limit


def calculate_total_price(items: List[Dict[str, float]]) -> float:
    """
    Calculate total price from list of items with prices
    Items format: [{"price": 100, "quantity": 2}, ...]
    """
    return sum(item.get("price", 0) * item.get("quantity", 1) for item in items)


def is_past(dt: datetime) -> bool:
    """Check if datetime is in the past"""
    return dt < datetime.utcnow()


def is_future(dt: datetime) -> bool:
    """Check if datetime is in the future"""
    return dt > datetime.utcnow()


def days_until(dt: datetime) -> int:
    """Calculate days until a datetime"""
    delta = dt - datetime.utcnow()
    return max(0, delta.days)


def minutes_ago(dt: datetime) -> int:
    """Calculate minutes since a datetime"""
    delta = datetime.utcnow() - dt
    return max(0, int(delta.total_seconds() / 60))


def format_datetime(dt: datetime) -> str:
    """Format datetime for display"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text"""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def anonymize_email(email: str) -> str:
    """Return anonymized version of email"""
    parts = email.split('@')
    if len(parts) != 2:
        return "***"
    local = parts[0]
    domain = parts[1]
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"
