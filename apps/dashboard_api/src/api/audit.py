from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.auth import CurrentUser, require_admin
from src.db.session import get_db
from src.models import AuditLog
from src.schemas.common import AuditOut

router = APIRouter(prefix='/audit-logs', tags=['audit'])


@router.get('', response_model=list[AuditOut])
def list_audit_logs(db: Session = Depends(get_db), _: CurrentUser = Depends(require_admin)):
    return list(db.execute(select(AuditLog).order_by(AuditLog.id.desc())).scalars())
