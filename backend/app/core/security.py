"""Password hashing and JWT token creation/verification."""
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash of the password. Never store raw passwords."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, expire_days: int | None = None) -> str:
    """
    Create a signed JWT containing the user's ID.
    The token expires after `expire_days` days (or the configured default).
    """
    minutes = (expire_days * 60 * 24) if expire_days else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> int | None:
    """Verify and decode a JWT. Returns the user ID, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
