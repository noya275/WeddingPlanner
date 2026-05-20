import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from ..database import Base


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    assigned_to = Column(String)
    due_date = Column(Date)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    category = Column(String)

    event = relationship("Event", back_populates="tasks")
