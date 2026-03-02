from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.auth import CurrentUser, require_admin
from src.db.session import get_db
from src.models import Run, RunStatus, Ticket, TicketStatus
from src.schemas.common import RunFinishPayload, RunOut
from src.services.audit import write_audit

router = APIRouter(prefix='/runs', tags=['runs'])


@router.post('/next', response_model=RunOut)
def run_next(ticket_id: int | None = Query(default=None), db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    if ticket_id:
        ticket = db.get(Ticket, ticket_id)
    else:
        ticket = db.execute(select(Ticket).where(Ticket.status == TicketStatus.QUEUED).order_by(Ticket.queued_at.asc(), Ticket.id.asc())).scalar()
    if not ticket:
        raise HTTPException(404, 'No queued ticket found')
    if ticket.status != TicketStatus.QUEUED:
        raise HTTPException(409, 'Ticket must be QUEUED to run')

    ticket.status = TicketStatus.RUNNING
    ticket.started_at = datetime.utcnow()
    run = Run(ticket_id=ticket.id, status=RunStatus.RUNNING)
    db.add(run)
    db.flush()
    write_audit(db, user.id, 'RUN_STARTED', 'run', str(run.id), {'ticket_id': ticket.id})
    db.commit()
    db.refresh(run)
    return run


@router.post('/{run_id}/finish', response_model=RunOut)
def finish_run(run_id: int, payload: RunFinishPayload, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    if payload.status not in {RunStatus.DONE, RunStatus.FAILED}:
        raise HTTPException(409, 'Run finish status must be DONE or FAILED')
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, 'Run not found')
    if run.status != RunStatus.RUNNING:
        raise HTTPException(409, 'Only RUNNING runs can be finished')
    ticket = db.get(Ticket, run.ticket_id)
    if not ticket or ticket.status != TicketStatus.RUNNING:
        raise HTTPException(409, 'Linked ticket is not RUNNING')

    run.status = payload.status
    run.finished_at = datetime.utcnow()
    run.logs_url = payload.logs_url
    run.artifacts = payload.artifacts

    ticket.status = TicketStatus.DONE if payload.status == RunStatus.DONE else TicketStatus.FAILED
    ticket.finished_at = datetime.utcnow()

    write_audit(db, user.id, 'RUN_FINISHED', 'run', str(run.id), {'status': payload.status.value})
    db.commit()
    db.refresh(run)
    return run


@router.get('', response_model=list[RunOut])
def list_runs(db: Session = Depends(get_db), _: CurrentUser = Depends(require_admin)):
    return list(db.execute(select(Run).order_by(Run.id.desc())).scalars())
