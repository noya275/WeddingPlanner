import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class RSVPStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"


class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    rsvp_status = Column(Enum(RSVPStatus), default=RSVPStatus.pending)
    dietary_restrictions = Column(String)
    plus_one = Column(Boolean, default=False)
    table_number = Column(Integer)
    notes = Column(String)

    event = relationship("Event", back_populates="guests")
