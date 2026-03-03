from datetime import datetime

from typing import Literal

from pydantic import BaseModel

from src.models import RunStatus, TicketPriority, TicketStatus

TicketType = Literal['Bug', 'Improvement', 'Documentation Needed', 'Task', 'New Feature']


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    type: TicketType
    status: TicketStatus
    priority: TicketPriority
    created_by: int
    project_id: int
    assigned_agent: str
    approved_by: int | None
    approved_at: datetime | None
    queued_at: datetime | None
    started_at: datetime | None
    finished_at: datetime | None
    metadata_json: dict | None = None

    model_config = {'from_attributes': True}


class TicketCreate(BaseModel):
    title: str
    description: str
    type: TicketType
    priority: TicketPriority = TicketPriority.P2
    project_id: int
    assigned_agent: str = 'dashboard-dev'
    metadata_json: dict | None = None


class TicketUpdate(BaseModel):
    title: str
    description: str
    type: TicketType
    priority: TicketPriority
    project_id: int
    assigned_agent: str
    metadata_json: dict | None = None


class ActionPayload(BaseModel):
    reason: str | None = None


class RunOut(BaseModel):
    id: int
    ticket_id: int
    status: RunStatus
    started_at: datetime
    finished_at: datetime | None
    logs_url: str | None
    artifacts: dict | None

    model_config = {'from_attributes': True}


class RunFinishPayload(BaseModel):
    status: RunStatus
    logs_url: str | None = None
    artifacts: dict | None = None


class AuditOut(BaseModel):
    id: int
    actor_user_id: int
    action: str
    entity_type: str
    entity_id: str
    detail: dict | None
    created_at: datetime

    model_config = {'from_attributes': True}


class AgentOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool

    model_config = {'from_attributes': True}


class AgentCreate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class AgentUpdate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool

    model_config = {'from_attributes': True}


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class ProjectUpdate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool
