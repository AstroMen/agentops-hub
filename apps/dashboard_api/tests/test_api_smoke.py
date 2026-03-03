import pytest
from fastapi import HTTPException

from src.api.agents import create_agent
from src.api.runs import finish_run, run_next
from src.api.tickets import approve_ticket, create_ticket, get_ticket, queue_ticket
from src.core.auth import CurrentUser, require_admin
from src.main import health
from src.schemas.common import AgentCreate, RunFinishPayload, TicketCreate

ADMIN = CurrentUser(id=1, role='Admin')
MEMBER = CurrentUser(id=2, role='Member')


def test_health_endpoint():
    assert health() == {'status': 'ok'}


def test_member_cannot_be_admin():
    with pytest.raises(HTTPException) as error:
        require_admin(MEMBER)

    assert error.value.status_code == 403
    assert error.value.detail == 'Admin role required'


def test_ticket_to_run_happy_path(db_session):
    agent = create_agent(AgentCreate(name='agent-alpha', description='demo', is_active=True), db_session, ADMIN)
    assert agent.name == 'agent-alpha'

    ticket = create_ticket(
        TicketCreate(
            title='Smoke test ticket',
            description='Validate major workflow',
            type='Bug',
            priority='P1',
            assigned_agent='agent-alpha',
            metadata_json={'source': 'test'},
        ),
        db_session,
        MEMBER,
    )
    assert ticket.status.value == 'PENDING_APPROVAL'

    approved = approve_ticket(ticket.id, db_session, ADMIN)
    assert approved.status.value == 'APPROVED'

    queued = queue_ticket(ticket.id, db_session, ADMIN)
    assert queued.status.value == 'QUEUED'

    run = run_next(ticket.id, db_session, ADMIN)
    assert run.status.value == 'RUNNING'

    finished = finish_run(
        run.id,
        RunFinishPayload(status='DONE', logs_url='https://example/logs', artifacts={'count': 1}),
        db_session,
        ADMIN,
    )
    assert finished.status.value == 'DONE'

    updated_ticket = get_ticket(ticket.id, db_session, ADMIN)
    assert updated_ticket.status.value == 'DONE'
