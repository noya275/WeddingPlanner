from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.vendor import Vendor
from ..models.user import User
from ..schemas.vendor import VendorCreate, VendorUpdate, VendorOut
from ..deps import get_current_user, get_event_or_404

router = APIRouter(tags=["vendors"])


def get_vendor_or_404(vendor_id: int, event_id: int, db: Session) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.event_id == event_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.get("/events/{event_id}/vendors", response_model=List[VendorOut])
def list_vendors(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    return db.query(Vendor).filter(Vendor.event_id == event_id).all()


@router.post("/events/{event_id}/vendors", response_model=VendorOut, status_code=201)
def create_vendor(
    event_id: int,
    data: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    vendor = Vendor(**data.model_dump(), event_id=event_id)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/events/{event_id}/vendors/{vendor_id}", response_model=VendorOut)
def get_vendor(
    event_id: int,
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    return get_vendor_or_404(vendor_id, event_id, db)


@router.patch("/events/{event_id}/vendors/{vendor_id}", response_model=VendorOut)
def update_vendor(
    event_id: int,
    vendor_id: int,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    vendor = get_vendor_or_404(vendor_id, event_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/events/{event_id}/vendors/{vendor_id}", status_code=204)
def delete_vendor(
    event_id: int,
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_event_or_404(event_id, current_user.id, db)
    vendor = get_vendor_or_404(vendor_id, event_id, db)
    db.delete(vendor)
    db.commit()
