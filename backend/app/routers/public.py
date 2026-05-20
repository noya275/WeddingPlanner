from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.guest import Guest, RSVPStatus

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/rsvp/{token}")
def get_rsvp(token: str, db: Session = Depends(get_db)):
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
def submit_rsvp(token: str, body: dict, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.rsvp_token == token).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Invalid RSVP link")
    status = body.get("status")
    if status not in ("confirmed", "declined"):
        raise HTTPException(status_code=400, detail="Status must be confirmed or declined")
    guest.rsvp_status = RSVPStatus(status)
    db.commit()
    return {"ok": True, "status": status}
