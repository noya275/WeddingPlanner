from pydantic import BaseModel
from typing import Optional
from ..models.guest import RSVPStatus


class GuestCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    rsvp_status: RSVPStatus = RSVPStatus.pending
    dietary_restrictions: Optional[str] = None
    plus_one: bool = False
    table_number: Optional[int] = None
    notes: Optional[str] = None
    side: Optional[str] = None


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rsvp_status: Optional[RSVPStatus] = None
    dietary_restrictions: Optional[str] = None
    plus_one: Optional[bool] = None
    table_number: Optional[int] = None
    notes: Optional[str] = None
    rsvp_sent: Optional[bool] = None
    side: Optional[str] = None


class GuestOut(GuestCreate):
    id: int
    event_id: int
    rsvp_token: Optional[str] = None
    rsvp_sent: bool = False

    model_config = {"from_attributes": True}


class PublicGuestOut(BaseModel):
    name: str
    rsvp_status: str
    event_title: str
    event_date: Optional[str] = None

    model_config = {"from_attributes": True}
