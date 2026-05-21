"""Shared FastAPI dependencies injected into route handlers."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .core.security import decode_token
from .models.user import User
from .models.event import Event

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Decode the Bearer token and return the authenticated user, or raise 401."""
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_event_or_404(event_id: int, user_id: int, db: Session) -> Event:
    """Fetch an event owned by the given user, or raise 404. Prevents cross-user access."""
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
