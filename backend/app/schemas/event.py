"""
Pydantic schemas for the /events API.

EventCreate / EventUpdate  — validate incoming request bodies.
EventOut                   — shape of the JSON the API returns.
These are separate from the SQLAlchemy Event model: schemas are the API boundary,
models are the database layer.
"""
from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Optional
from decimal import Decimal


class EventCreate(BaseModel):
    """Fields required to create a new wedding event."""
    title: str
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    budget_total: Optional[Decimal] = None


class EventUpdate(BaseModel):
    """All fields optional so clients can PATCH a single field at a time."""
    title: Optional[str] = None
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    budget_total: Optional[Decimal] = None


class EventOut(BaseModel):
    """Full event representation returned by the API, including server-set id and created_at."""
    id: int
    title: str
    date: Optional[DateType]
    venue: Optional[str]
    description: Optional[str]
    budget_total: Optional[Decimal]
    created_at: datetime

    # from_attributes=True lets Pydantic read from SQLAlchemy ORM objects, not just dicts.
    model_config = {"from_attributes": True}
