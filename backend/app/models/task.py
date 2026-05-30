import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..database import Base


class TaskStatus(str, enum.Enum):
    """Allowed progress states for a task."""
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Task(Base):
    """A to-do item belonging to an event (e.g. 'Book florist', 'Send invites')."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)

    event = relationship("Event", back_populates="tasks")
