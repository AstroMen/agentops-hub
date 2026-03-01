from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.db.session import get_db
from src.models import User


@dataclass
class CurrentUser:
    id: int
    role: str


def _ensure_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> CurrentUser:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing Bearer token')
    token = authorization.split(' ', 1)[1]
    if token == settings.admin_token:
        user = _ensure_user(db, 'admin@local')
        return CurrentUser(id=user.id, role='Admin')
    if token == settings.member_token:
        user = _ensure_user(db, 'member@local')
        return CurrentUser(id=user.id, role='Member')
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != 'Admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin role required')
    return user
