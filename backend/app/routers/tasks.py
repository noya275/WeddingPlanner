from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.task import Task
from ..models.user import User
from ..schemas.task import TaskCreate, TaskUpdate, TaskOut
from ..deps import get_current_user, get_event_or_404

router = APIRouter(tags=["tasks"])


def get_task_or_404(task_id: int, event_id: int, db: Session) -> Task:
    """Fetch a task belonging to the given event, or raise 404."""
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/events/{event_id}/tasks", response_model=List[TaskOut])
def list_tasks(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all tasks for the event; requires auth and event ownership."""
    get_event_or_404(event_id, current_user.id, db)
    return db.query(Task).filter(Task.event_id == event_id).all()


@router.post("/events/{event_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(
    event_id: int,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task under the specified event; requires auth and event ownership."""
    get_event_or_404(event_id, current_user.id, db)
    task = Task(**data.model_dump(), event_id=event_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/events/{event_id}/tasks/{task_id}", response_model=TaskOut)
def get_task(
    event_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single task by id, scoped to the authenticated user's event."""
    get_event_or_404(event_id, current_user.id, db)
    return get_task_or_404(task_id, event_id, db)


@router.patch("/events/{event_id}/tasks/{task_id}", response_model=TaskOut)
def update_task(
    event_id: int,
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Partially update a task's title or status; only supplied fields are written."""
    get_event_or_404(event_id, current_user.id, db)
    task = get_task_or_404(task_id, event_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/events/{event_id}/tasks/{task_id}", status_code=204)
def delete_task(
    event_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a task; returns 204 No Content on success."""
    get_event_or_404(event_id, current_user.id, db)
    task = get_task_or_404(task_id, event_id, db)
    db.delete(task)
    db.commit()
