from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.event import Event
from ..models.user import User
from ..schemas.event import EventCreate, EventUpdate, EventOut
from .auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


def get_event_or_404(event_id: int, user_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/", response_model=List[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Event).filter(Event.user_id == current_user.id).all()


@router.post("/", response_model=EventOut, status_code=201)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = Event(**data.model_dump(), user_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_event_or_404(event_id, current_user.id, db)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_event_or_404(event_id, current_user.id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_event_or_404(event_id, current_user.id, db)
    db.delete(event)
    db.commit()
