from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.auth import CurrentUser, get_current_user, require_admin
from src.db.session import get_db
from src.models import Ticket, TicketPriority, TicketStatus
from src.schemas.common import ActionPayload, TicketCreate, TicketOut, TicketUpdate
from src.services.audit import write_audit

router = APIRouter(prefix='/tickets', tags=['tickets'])


@router.post('', response_model=TicketOut)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        type=payload.type,
        priority=payload.priority,
        status=TicketStatus.PENDING_APPROVAL,
        created_by=user.id,
        assigned_agent=payload.assigned_agent,
        metadata_json=payload.metadata_json,
    )
    db.add(ticket)
    write_audit(db, user.id, 'TICKET_CREATED', 'ticket', 'new', {'title': payload.title})
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get('', response_model=list[TicketOut])
def list_tickets(
    status: TicketStatus | None = Query(default=None),
    priority: TicketPriority | None = Query(default=None),
    assigned_agent: str | None = Query(default=None),
    type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    stmt = select(Ticket)
    if status:
        stmt = stmt.where(Ticket.status == status)
    if priority:
        stmt = stmt.where(Ticket.priority == priority)
    if assigned_agent:
        stmt = stmt.where(Ticket.assigned_agent == assigned_agent)
    if type:
        stmt = stmt.where(Ticket.type == type)
    return list(db.execute(stmt.order_by(Ticket.id.desc())).scalars())


@router.put('/{ticket_id}', response_model=TicketOut)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, 'Ticket not found')

    _ensure_update_permission(ticket, user)

    ticket.title = payload.title
    ticket.description = payload.description
    ticket.type = payload.type
    ticket.priority = payload.priority
    ticket.assigned_agent = payload.assigned_agent
    ticket.metadata_json = payload.metadata_json

    write_audit(db, user.id, 'TICKET_UPDATED', 'ticket', str(ticket.id), {'title': payload.title})
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get('/{ticket_id}', response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), _: CurrentUser = Depends(get_current_user)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, 'Ticket not found')
    return ticket


def _ensure_update_permission(ticket: Ticket, user: CurrentUser):
    if user.role == 'Admin':
        return
    if ticket.created_by != user.id:
        raise HTTPException(403, 'You can only edit your own tickets')
    if ticket.status != TicketStatus.PENDING_APPROVAL:
        raise HTTPException(403, 'Only pending tickets can be edited by members')


def _transition(ticket: Ticket, expect: TicketStatus, to: TicketStatus):
    if ticket.status != expect:
        raise HTTPException(409, f'Invalid status transition: expected {expect}, got {ticket.status}')
    ticket.status = to


@router.post('/{ticket_id}/approve', response_model=TicketOut)
def approve_ticket(ticket_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, 'Ticket not found')
    _transition(ticket, TicketStatus.PENDING_APPROVAL, TicketStatus.APPROVED)
    ticket.approved_by = user.id
    ticket.approved_at = datetime.utcnow()
    write_audit(db, user.id, 'TICKET_APPROVED', 'ticket', str(ticket.id))
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post('/{ticket_id}/reject', response_model=TicketOut)
def reject_ticket(ticket_id: int, payload: ActionPayload, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, 'Ticket not found')
    _transition(ticket, TicketStatus.PENDING_APPROVAL, TicketStatus.REJECTED)
    write_audit(db, user.id, 'TICKET_REJECTED', 'ticket', str(ticket.id), {'reason': payload.reason})
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post('/{ticket_id}/queue', response_model=TicketOut)
def queue_ticket(ticket_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, 'Ticket not found')
    _transition(ticket, TicketStatus.APPROVED, TicketStatus.QUEUED)
    ticket.queued_at = datetime.utcnow()
    write_audit(db, user.id, 'TICKET_QUEUED', 'ticket', str(ticket.id))
    db.commit()
    db.refresh(ticket)
    return ticket
