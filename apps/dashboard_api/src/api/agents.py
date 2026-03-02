from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.auth import CurrentUser, get_current_user, require_admin
from src.db.session import get_db
from src.models import Agent, Ticket
from src.schemas.common import AgentCreate, AgentOut, AgentUpdate
from src.services.audit import write_audit

router = APIRouter(prefix='/agents', tags=['agents'])


@router.get('', response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db), _: CurrentUser = Depends(get_current_user)):
    stmt = select(Agent).order_by(Agent.name.asc())
    return list(db.execute(stmt).scalars())


@router.post('', response_model=AgentOut)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    agent = Agent(name=payload.name, description=payload.description, is_active=payload.is_active)
    db.add(agent)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Agent name already exists')
    db.refresh(agent)
    write_audit(db, user.id, 'AGENT_CREATED', 'agent', str(agent.id), {'name': agent.name})
    db.commit()
    return agent


@router.put('/{agent_id}', response_model=AgentOut)
def update_agent(agent_id: int, payload: AgentUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(404, 'Agent not found')
    agent.name = payload.name
    agent.description = payload.description
    agent.is_active = payload.is_active
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Agent name already exists')
    db.refresh(agent)
    write_audit(db, user.id, 'AGENT_UPDATED', 'agent', str(agent.id), {'name': agent.name})
    db.commit()
    return agent


@router.post('/{agent_id}/update', response_model=AgentOut)
def update_agent_via_post(agent_id: int, payload: AgentUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return update_agent(agent_id=agent_id, payload=payload, db=db, user=user)


@router.delete('/{agent_id}')
def delete_agent(agent_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(404, 'Agent not found')
    used_ticket = db.execute(select(Ticket.id).where(Ticket.assigned_agent == agent.name).limit(1)).scalar_one_or_none()
    if used_ticket is not None:
        raise HTTPException(409, 'Agent is assigned to existing tickets and cannot be deleted')
    db.delete(agent)
    write_audit(db, user.id, 'AGENT_DELETED', 'agent', str(agent.id), {'name': agent.name})
    db.commit()
    return {'ok': True}
