from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.event import Event
from ..models.budget import BudgetItem
from ..models.user import User
from ..schemas.budget import BudgetItemCreate, BudgetItemUpdate, BudgetItemOut
from .auth import get_current_user

router = APIRouter(tags=["budget"])


def get_event_or_404(event_id: int, user_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def get_item_or_404(item_id: int, event_id: int, db: Session) -> BudgetItem:
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id, BudgetItem.event_id == event_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")
    return item


@router.get("/events/{event_id}/budget", response_model=List[BudgetItemOut])
def list_budget_items(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    return db.query(BudgetItem).filter(BudgetItem.event_id == event_id).all()


@router.post("/events/{event_id}/budget", response_model=BudgetItemOut, status_code=201)
def create_budget_item(
    event_id: int,
    data: BudgetItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    item = BudgetItem(**data.model_dump(), event_id=event_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/events/{event_id}/budget/{item_id}", response_model=BudgetItemOut)
def update_budget_item(
    event_id: int,
    item_id: int,
    data: BudgetItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    item = get_item_or_404(item_id, event_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/events/{event_id}/budget/{item_id}", status_code=204)
def delete_budget_item(
    event_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    item = get_item_or_404(item_id, event_id, db)
    db.delete(item)
    db.commit()
