from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.guest import Guest, RSVPStatus

router = APIRouter(prefix="/public", tags=["public"])

# No auth required — these routes are accessed via unique RSVP links sent to guests.


class RSVPSubmit(BaseModel):
    status: Literal["confirmed", "declined", "maybe"]


@router.get("/rsvp/{token}")
def get_rsvp(token: str, db: Session = Depends(get_db)):
    """Look up a guest by their RSVP token and return their name, current status, and event info."""
    guest = db.query(Guest).filter(Guest.rsvp_token == token).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Invalid RSVP link")
    return {
        "name": guest.name,
        "rsvp_status": guest.rsvp_status,
        "event_title": guest.event.title,
        "event_date": str(guest.event.date) if guest.event.date else None,
    }


@router.post("/rsvp/{token}")
def submit_rsvp(token: str, body: RSVPSubmit, db: Session = Depends(get_db)):
    """Record the guest's RSVP choice. Token acts as auth — no login needed."""
    guest = db.query(Guest).filter(Guest.rsvp_token == token).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Invalid RSVP link")
    guest.rsvp_status = RSVPStatus(body.status)
    db.commit()
    return {"ok": True, "status": body.status}
