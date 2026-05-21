"""Pydantic schemas for user registration, profile responses, and auth tokens."""
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr  # EmailStr validates format (requires email-validator package)
    name: str
    password: str    # plain-text here; hashed before it ever touches the database


class UserOut(BaseModel):
    """Public user profile returned by the API. Never exposes password_hash."""
    id: int
    email: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT response shape. token_type is always 'bearer' per OAuth2 convention."""
    access_token: str
    token_type: str = "bearer"
