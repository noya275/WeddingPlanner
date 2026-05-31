from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.event import Event
from ..models.vendor import Vendor
from ..models.user import User
from ..schemas.event import EventCreate, EventUpdate, EventOut
from ..deps import get_current_user, get_event_or_404

DEFAULT_VENDORS = [
    ('Wedding Dress', 'Bride', 10),
    ("Bride's Shoes", 'Bride', 20),
    ("Bride's Jewelry", 'Bride', 30),
    ("Bride's Makeup", 'Bride', 40),
    ('Pre-Wedding Facial', 'Bride', 50),
    ("Bride's Hair", 'Bride', 60),
    ("Bride's Nails", 'Bride', 70),
    ('Bridal Bouquet', 'Bride', 80),
    ("Groom's Suit", 'Groom', 90),
    ("Groom's Shoes", 'Groom', 100),
    ("Groom's Accessories", 'Groom', 110),
    ("Groom's Haircut & Grooming", 'Groom', 120),
    ('Event Venue', 'Venue / Hall', 130),
    ('Lighting & Sound', 'Venue / Hall', 140),
    ('Chuppah Design', 'Venue / Hall', 150),
    ('ACUM License Fee', 'Venue / Hall', 160),
    ('Venue Staff Tips', 'Venue / Hall', 170),
    ('Rabbinate Registration', 'Rabbinate', 180),
    ('Officiating Rabbi', 'Rabbinate', 190),
    ('Wedding Rings', 'Rabbinate', 200),
    ('Ring Pillow', 'Rabbinate', 210),
    ('Wedding Car Rental', 'Vehicle / Transportation', 220),
    ('Car Decoration', 'Vehicle / Transportation', 230),
    ('Transportation / Buses', 'Vehicle / Transportation', 240),
    ('DJ', 'Must-Have Vendors', 250),
    ('Photographer', 'Must-Have Vendors', 260),
    ('Alcohol', 'Must-Have Vendors', 270),
    ('Wedding Invitations', 'Must-Have Vendors', 280),
    ('RSVP', 'Must-Have Vendors', 290),
    ('Wedding Gimmicks', 'Must-Have Vendors', 300),
    ('Photo Magnets', 'Optional Vendors', 310),
    ('Attractions (Photo Booth, etc.)', 'Optional Vendors', 320),
    ('Guest Gifts', 'Optional Vendors', 330),
    ('External Wedding Planner', 'Optional Vendors', 340),
    ('Post-Event Hotel', 'Optional Vendors', 350),
    ('Singer / Entertainer', 'Optional Vendors', 360),
]

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=List[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all events belonging to the authenticated user."""
    return db.query(Event).filter(Event.user_id == current_user.id).all()


@router.post("/", response_model=EventOut, status_code=201)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new event owned by the authenticated user."""
    event = Event(**data.model_dump(), user_id=current_user.id)
    db.add(event)
    db.flush()
    for name, category, sort_order in DEFAULT_VENDORS:
        db.add(Vendor(event_id=event.id, name=name, category=category, sort_order=sort_order))
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single event by id, scoped to the authenticated user."""
    return get_event_or_404(event_id, current_user.id, db)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Partially update an event. Only fields included in the request body are changed."""
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
    """Delete an event and all its guests, tasks, and vendors (cascade)."""
    event = get_event_or_404(event_id, current_user.id, db)
    db.delete(event)
    db.commit()
