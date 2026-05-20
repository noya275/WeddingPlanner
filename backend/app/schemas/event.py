from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class EventCreate(BaseModel):
    title: str
    date: Optional[date] = None
    venue: Optional[str] = None
    description: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    venue: Optional[str] = None
    description: Optional[str] = None


class EventOut(BaseModel):
    id: int
    title: str
    date: Optional[date]
    venue: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
