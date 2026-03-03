#!/usr/bin/env python3
"""Idempotent development seed for RBAC baseline data."""

from __future__ import annotations

from pathlib import Path
import sys

from sqlalchemy import select

PROJECT_ROOT = Path(__file__).resolve().parent.parent
API_ROOT = PROJECT_ROOT / 'apps' / 'dashboard_api'
sys.path.insert(0, str(API_ROOT))

from src.db.session import SessionLocal  # noqa: E402
from src.models import Permission, Role, RolePermission  # noqa: E402

ROLE_PERMISSIONS: dict[str, list[str]] = {
    'admin': [
        'ticket:create',
        'ticket:read',
        'ticket:approve',
        'ticket:queue',
        'ticket:execute',
        'run:read',
        'run:execute',
        'audit:read',
        'admin:manage_users',
    ],
    'member': [
        'ticket:create',
        'ticket:read',
    ],
}


def seed_rbac() -> tuple[int, int, int]:
    inserted_roles = 0
    inserted_permissions = 0
    inserted_mappings = 0

    with SessionLocal() as db:
        permissions_by_name: dict[str, Permission] = {}

        for permission_name in sorted({p for perms in ROLE_PERMISSIONS.values() for p in perms}):
            permission = db.execute(select(Permission).where(Permission.name == permission_name)).scalar_one_or_none()
            if permission is None:
                permission = Permission(name=permission_name)
                db.add(permission)
                db.flush()
                inserted_permissions += 1
            permissions_by_name[permission_name] = permission

        for role_name, permission_names in ROLE_PERMISSIONS.items():
            role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
            if role is None:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
                inserted_roles += 1

            for permission_name in permission_names:
                exists = db.execute(
                    select(RolePermission).where(
                        RolePermission.role_id == role.id,
                        RolePermission.permission_id == permissions_by_name[permission_name].id,
                    )
                ).scalar_one_or_none()
                if exists is None:
                    db.add(RolePermission(role_id=role.id, permission_id=permissions_by_name[permission_name].id))
                    inserted_mappings += 1

        db.commit()

    return inserted_roles, inserted_permissions, inserted_mappings


if __name__ == '__main__':
    roles, permissions, mappings = seed_rbac()
    print(
        'seed ok '
        f'(roles_inserted={roles}, permissions_inserted={permissions}, role_permissions_inserted={mappings})'
    )
