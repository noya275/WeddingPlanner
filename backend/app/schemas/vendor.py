"""Pydantic schemas for the /vendors API."""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class VendorCreate(BaseModel):
    """Fields accepted when adding a new vendor; sort_order of 0 triggers auto-assignment."""
    name: str
    vendor_name: Optional[str] = None
    category: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    price: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: bool = False
    sort_order: int = 0
    notes: Optional[str] = None


class VendorUpdate(BaseModel):
    """All fields optional so clients can PATCH a single vendor field at a time."""
    name: Optional[str] = None
    vendor_name: Optional[str] = None
    category: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    price: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: Optional[bool] = None
    sort_order: Optional[int] = None
    notes: Optional[str] = None


class VendorOut(VendorCreate):
    """Extends VendorCreate with server-assigned fields returned after creation."""
    id: int
    event_id: int

    model_config = {"from_attributes": True}
