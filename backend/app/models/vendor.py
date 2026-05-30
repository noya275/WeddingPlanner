from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class Vendor(Base):
    """A service provider (photographer, caterer, etc.) attached to an event."""
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    vendor_name = Column(String)
    category = Column(String)
    contact_name = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    price = Column(Numeric(10, 2))
    actual = Column(Numeric(10, 2))
    is_paid = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    notes = Column(String)

    event = relationship("Event", back_populates="vendors")
