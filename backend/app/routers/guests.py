import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.guest import Guest
from ..models.user import User
from ..schemas.guest import GuestCreate, GuestUpdate, GuestOut
from ..deps import get_current_user, get_event_or_404

router = APIRouter(tags=["guests"])


def get_guest_or_404(guest_id: int, event_id: int, db: Session) -> Guest:
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.event_id == event_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest


@router.get("/events/{event_id}/guests", response_model=List[GuestOut])
def list_guests(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    return db.query(Guest).filter(Guest.event_id == event_id).order_by(Guest.id).all()


@router.post("/events/{event_id}/guests", response_model=GuestOut, status_code=201)
def create_guest(
    event_id: int,
    data: GuestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    guest = Guest(**data.model_dump(), event_id=event_id, rsvp_token=secrets.token_urlsafe(16))
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


@router.get("/events/{event_id}/guests/{guest_id}", response_model=GuestOut)
def get_guest(
    event_id: int,
    guest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    return get_guest_or_404(guest_id, event_id, db)


@router.patch("/events/{event_id}/guests/{guest_id}", response_model=GuestOut)
def update_guest(
    event_id: int,
    guest_id: int,
    data: GuestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    guest = get_guest_or_404(guest_id, event_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(guest, field, value)
    db.commit()
    db.refresh(guest)
    return guest


@router.post("/events/{event_id}/guests/{guest_id}/rsvp-token", response_model=GuestOut)
def ensure_rsvp_token(
    event_id: int,
    guest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    guest = get_guest_or_404(guest_id, event_id, db)
    if not guest.rsvp_token:
        guest.rsvp_token = secrets.token_urlsafe(16)
        db.commit()
        db.refresh(guest)
    return guest


@router.delete("/events/{event_id}/guests/{guest_id}", status_code=204)
def delete_guest(
    event_id: int,
    guest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    guest = get_guest_or_404(guest_id, event_id, db)
    db.delete(guest)
    db.commit()
