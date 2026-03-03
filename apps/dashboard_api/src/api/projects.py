from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.auth import CurrentUser, get_current_user, require_admin
from src.db.session import get_db
from src.models import Project, Ticket
from src.schemas.common import ProjectCreate, ProjectOut, ProjectUpdate
from src.services.audit import write_audit

router = APIRouter(prefix='/projects', tags=['projects'])


@router.get('', response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), _: CurrentUser = Depends(get_current_user)):
    stmt = select(Project).order_by(Project.name.asc())
    return list(db.execute(stmt).scalars())


@router.post('', response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    project = Project(name=payload.name, description=payload.description, is_active=payload.is_active)
    db.add(project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Project name already exists')
    db.refresh(project)
    write_audit(db, user.id, 'PROJECT_CREATED', 'project', str(project.id), {'name': project.name})
    db.commit()
    return project


@router.put('/{project_id}', response_model=ProjectOut)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, 'Project not found')
    project.name = payload.name
    project.description = payload.description
    project.is_active = payload.is_active
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Project name already exists')
    db.refresh(project)
    write_audit(db, user.id, 'PROJECT_UPDATED', 'project', str(project.id), {'name': project.name})
    db.commit()
    return project


@router.post('/{project_id}/update', response_model=ProjectOut)
def update_project_via_post(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return update_project(project_id=project_id, payload=payload, db=db, user=user)


@router.delete('/{project_id}')
def delete_project(project_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, 'Project not found')
    used_ticket = db.execute(select(Ticket.id).where(Ticket.project_id == project.id).limit(1)).scalar_one_or_none()
    if used_ticket is not None:
        raise HTTPException(409, 'Project is referenced by existing tickets and cannot be deleted')
    db.delete(project)
    write_audit(db, user.id, 'PROJECT_DELETED', 'project', str(project.id), {'name': project.name})
    db.commit()
    return {'ok': True}
