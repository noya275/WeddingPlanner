from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class BudgetItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    estimated: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: bool = False


class BudgetItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    estimated: Optional[Decimal] = None
    actual: Optional[Decimal] = None
    is_paid: Optional[bool] = None


class BudgetItemOut(BaseModel):
    id: int
    event_id: int
    name: str
    category: Optional[str]
    estimated: Optional[Decimal]
    actual: Optional[Decimal]
    is_paid: bool

    model_config = {"from_attributes": True}
