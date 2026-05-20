import enum
import secrets
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


def _gen_token() -> str:
    return secrets.token_urlsafe(16)


class RSVPStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    maybe = "maybe"


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
    rsvp_token = Column(String, unique=True, index=True)
    rsvp_sent = Column(Boolean, default=False)
    side = Column(String)  # 'bride', 'groom', or None

    event = relationship("Event", back_populates="guests")
