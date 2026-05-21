"""Pydantic schemas for the /tasks API."""
from pydantic import BaseModel
from typing import Optional
from datetime import date as DateType
from ..models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[DateType] = None
    status: TaskStatus = TaskStatus.todo
    category: Optional[str] = None


class TaskUpdate(BaseModel):
    """All fields optional — supports moving just the status (kanban drag) or editing any field."""
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[DateType] = None
    status: Optional[TaskStatus] = None
    category: Optional[str] = None


class TaskOut(TaskCreate):
    """Extends TaskCreate with server-assigned fields returned after creation."""
    id: int
    event_id: int

    model_config = {"from_attributes": True}
