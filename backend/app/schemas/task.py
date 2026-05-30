"""Pydantic schemas for the /tasks API."""
from pydantic import BaseModel
from typing import Optional
from ..models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    status: TaskStatus = TaskStatus.todo


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[TaskStatus] = None


class TaskOut(TaskCreate):
    """Extends TaskCreate with server-assigned fields returned after creation."""
    id: int
    event_id: int

    model_config = {"from_attributes": True}
