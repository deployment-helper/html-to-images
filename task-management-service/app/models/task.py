from datetime import datetime
from typing import Dict, Optional
from sqlmodel import SQLModel, Field, JSON
from app.models.status import Status
from app.utils.uuid import generate_uuid


class Task(SQLModel, table=True):
    id: str = Field(primary_key=True, default_factory=generate_uuid)
    status: Status = Field(default=Status.TODO)
    input: Dict = Field(default_factory=dict, sa_type=JSON)
    output: Optional[Dict] = Field(default=None, sa_type=JSON)
    created_at: datetime = Field(default_factory=datetime.now)
