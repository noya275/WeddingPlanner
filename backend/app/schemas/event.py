from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Optional


class EventCreate(BaseModel):
    title: str
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None


class EventOut(BaseModel):
    id: int
    title: str
    date: Optional[DateType]
    venue: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
