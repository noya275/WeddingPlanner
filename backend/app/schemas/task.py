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
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[DateType] = None
    status: Optional[TaskStatus] = None
    category: Optional[str] = None


class TaskOut(TaskCreate):
    id: int
    event_id: int

    model_config = {"from_attributes": True}
