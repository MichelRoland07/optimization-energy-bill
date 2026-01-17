"""
Permissions middleware and decorators
"""
from fastapi import Depends, HTTPException, status
from .utils import get_current_user
from .models import User


def require_permission(permission: str):
    """
    Dependency factory to require a specific permission

    Usage:
        @router.get("/optimisation")
        async def get_optimisation(
            current_user: User = Depends(require_permission("view_optimisation"))
        ):
            ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission refusée. Vous n'avez pas l'accès '{permission}'"
            )
        return current_user

    return permission_checker


def require_any_permission(*permissions: str):
    """
    Dependency factory to require ANY of the specified permissions

    Usage:
        @router.get("/data")
        async def get_data(
            current_user: User = Depends(require_any_permission("view_profil", "view_reconstitution"))
        ):
            ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not any(current_user.has_permission(perm) for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission refusée. Vous devez avoir au moins l'une de ces permissions: {', '.join(permissions)}"
            )
        return current_user

    return permission_checker


def require_all_permissions(*permissions: str):
    """
    Dependency factory to require ALL of the specified permissions

    Usage:
        @router.post("/upload")
        async def upload(
            current_user: User = Depends(require_all_permissions("upload_data", "manage_users"))
        ):
            ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not all(current_user.has_permission(perm) for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission refusée. Vous devez avoir toutes ces permissions: {', '.join(permissions)}"
            )
        return current_user

    return permission_checker


def require_active_account(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to require an active account

    Usage:
        @router.get("/protected")
        async def protected_route(
            current_user: User = Depends(require_active_account)
        ):
            ...
    """
    if not current_user.is_active or current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Votre compte n'est pas actif. Statut: {current_user.status}"
        )
    return current_user
