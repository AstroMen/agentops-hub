from datetime import datetime

from pydantic import BaseModel

from src.models import RunStatus, TicketPriority, TicketStatus


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    type: str
    status: TicketStatus
    priority: TicketPriority
    created_by: int
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
    type: str
    priority: TicketPriority = TicketPriority.P2
    assigned_agent: str = 'dashboard-dev'
    metadata_json: dict | None = None


class TicketUpdate(BaseModel):
    title: str
    description: str
    type: str
    priority: TicketPriority
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
