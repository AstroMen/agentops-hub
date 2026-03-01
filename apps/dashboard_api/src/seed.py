from sqlalchemy import select

from src.db.session import SessionLocal
from src.models import Permission, Role, RolePermission

ROLE_PERMS = {
    'Admin': [
        'ticket:create', 'ticket:read', 'ticket:approve', 'ticket:queue', 'ticket:execute',
        'audit:read', 'admin:manage_users'
    ],
    'Member': ['ticket:create', 'ticket:read'],
}


def seed_rbac() -> None:
    db = SessionLocal()
    try:
        permissions = {}
        for permission_name in sorted(set(sum(ROLE_PERMS.values(), []))):
            permission = db.execute(select(Permission).where(Permission.name == permission_name)).scalar_one_or_none()
            if not permission:
                permission = Permission(name=permission_name)
                db.add(permission)
                db.flush()
            permissions[permission_name] = permission

        for role_name, role_perms in ROLE_PERMS.items():
            role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
            for perm_name in role_perms:
                exists = db.execute(
                    select(RolePermission).where(
                        RolePermission.role_id == role.id,
                        RolePermission.permission_id == permissions[perm_name].id,
                    )
                ).scalar_one_or_none()
                if not exists:
                    db.add(RolePermission(role_id=role.id, permission_id=permissions[perm_name].id))
        db.commit()
    finally:
        db.close()


if __name__ == '__main__':
    seed_rbac()
