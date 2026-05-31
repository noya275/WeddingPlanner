from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Event(Base):
    """A wedding or celebration event. Owns guests, tasks, and vendors."""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(Date)
    budget_total = Column(Numeric(12, 2))
    table_count = Column(Integer, default=8)
    table_capacity = Column(Integer, default=10)
    done_tables = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="events")
    guests = relationship("Guest", back_populates="event", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="event", cascade="all, delete-orphan")
