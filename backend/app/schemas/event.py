from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Optional
from decimal import Decimal


class EventCreate(BaseModel):
    title: str
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    budget_total: Optional[Decimal] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[DateType] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    budget_total: Optional[Decimal] = None


class EventOut(BaseModel):
    id: int
    title: str
    date: Optional[DateType]
    venue: Optional[str]
    description: Optional[str]
    budget_total: Optional[Decimal]
    created_at: datetime

    model_config = {"from_attributes": True}
