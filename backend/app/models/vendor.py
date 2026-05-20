import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from ..database import Base


class VendorStatus(str, enum.Enum):
    prospect = "prospect"
    contacted = "contacted"
    booked = "booked"
    cancelled = "cancelled"


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    contact_name = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    price = Column(Numeric(10, 2))
    status = Column(Enum(VendorStatus), default=VendorStatus.prospect)
    notes = Column(String)

    event = relationship("Event", back_populates="vendors")
