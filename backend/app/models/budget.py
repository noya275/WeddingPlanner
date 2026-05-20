from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    estimated = Column(Numeric(12, 2))
    actual = Column(Numeric(12, 2))
    is_paid = Column(Boolean, default=False)

    event = relationship("Event", back_populates="budget_items")
