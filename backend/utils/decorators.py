"""
Decorators Utility
Purpose: Custom decorators for request validation, rate limiting, and error handling
"""

from functools import wraps
from fastapi import HTTPException, status
from typing import Callable, Optional, List


def require_admin(func: Callable) -> Callable:
    """Decorator to require admin role"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # TODO: Check if current user is admin
        # If not: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        return await func(*args, **kwargs)
    return wrapper


def require_authenticated(func: Callable) -> Callable:
    """Decorator to require authenticated user"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # TODO: Check if user is authenticated
        # If not: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        return await func(*args, **kwargs)
    return wrapper


def rate_limit(max_calls: int = 100, time_window: int = 60) -> Callable:
    """
    Decorator for rate limiting
    max_calls: Maximum number of calls
    time_window: Time window in seconds
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # TODO: Implement rate limiting logic
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def validate_ownership(resource_type: str) -> Callable:
    """
    Decorator to validate ownership of a resource
    resource_type: Type of resource (post, product, etc.)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # TODO: Check if current user owns the resource
            # If not: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def handle_exceptions(func: Callable) -> Callable:
    """Decorator for centralized exception handling"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
    return wrapper
