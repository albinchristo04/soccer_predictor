"""
Password hashing utilities.
"""

import hashlib
import secrets
import hmac
from typing import Tuple


def _hash_with_salt(password: str, salt: str) -> str:
    """Hash password with salt using PBKDF2."""
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # iterations
    )
    return key.hex()


def hash_password(password: str) -> str:
    """
    Hash a password for storage.
    
    Returns:
        String in format: salt$hash
    """
    salt = secrets.token_hex(16)
    password_hash = _hash_with_salt(password, salt)
    return f"{salt}${password_hash}"


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        password: Plain text password
        hashed: Hashed password in format salt$hash
    
    Returns:
        True if password matches
    """
    try:
        parts = hashed.split('$')
        if len(parts) != 2:
            return False
        
        salt, stored_hash = parts
        computed_hash = _hash_with_salt(password, salt)
        
        return hmac.compare_digest(computed_hash, stored_hash)
    except Exception:
        return False
