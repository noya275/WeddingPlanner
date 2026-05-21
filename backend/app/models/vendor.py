import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Numeric, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class VendorStatus(str, enum.Enum):
    """Booking lifecycle stages for a vendor."""
    prospect = "prospect"
    contacted = "contacted"
    booked = "booked"
    cancelled = "cancelled"


class Vendor(Base):
    """A service provider (photographer, caterer, etc.) attached to an event."""
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    contact_name = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    price = Column(Numeric(10, 2))
    actual = Column(Numeric(10, 2))
    is_paid = Column(Boolean, default=False)
    status = Column(Enum(VendorStatus), default=VendorStatus.prospect)
    notes = Column(String)

    event = relationship("Event", back_populates="vendors")
