"""Pydantic schemas for the /vendors API."""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from ..models.vendor import VendorStatus


class VendorCreate(BaseModel):
    name: str
    vendor_name: Optional[str] = None
    category: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    price: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: bool = False
    status: VendorStatus = VendorStatus.prospect
    sort_order: int = 0
    notes: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    vendor_name: Optional[str] = None
    category: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    price: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: Optional[bool] = None
    status: Optional[VendorStatus] = None
    sort_order: Optional[int] = None
    notes: Optional[str] = None


class VendorOut(VendorCreate):
    """Extends VendorCreate with server-assigned fields returned after creation."""
    id: int
    event_id: int

    model_config = {"from_attributes": True}
