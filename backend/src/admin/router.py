from src.admin.dependencies import get_admin_service
from src.admin.services import AdminService
from src.auth.dependencies import role_required
from src.users.schemas import ResponseUserDTO
from src.auth.models import User
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from typing import List, Annotated
import uuid

router = APIRouter()

@router.get("/users", response_model=List[ResponseUserDTO])
async def get_users(
    limit: int = 5,
    skip: int = 0,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service),
):
    return await service.get_users(limit=limit, skip=skip)

@router.get("/users/{user_id}", response_model=ResponseUserDTO)
async def get_user_by_id(
    user_id: uuid.UUID,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
    ):
    return await service.get_user(user_id=user_id)

@router.post("/bans", response_model=ResponseUserDTO)
async def ban_users(
    user_id: uuid.UUID,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return await service.ban_user(user_id=user_id)

@router.delete("/unbans", response_model=ResponseUserDTO)
async def unban_users(
    user_id: uuid.UUID,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return await service.unban_user(user_id=user_id)

@router.delete("/unbans/", response_model=ResponseUserDTO, deprecated=True)
async def unban_users_by_email(
    email: str,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return service.ban_user_by_email(email=email)

@router.get("/bans", response_model=List[ResponseUserDTO])
async def get_banned_users(
    limit: int = 5,
    skip: int = 0,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_all_banned_users(limit=limit, skip=skip)

@router.get("/bans/{user_id}", response_model=ResponseUserDTO)
async def get_banned_user(
    user_id: uuid.UUID,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_banned_user(user_id=user_id)

@router.post("/bans/email", response_model=ResponseUserDTO)
async def ban_users_by_email(
    email: str,
    user: User = Depends(role_required("admin")),
    service: AdminService = Depends(get_admin_service)
):
    return await service.ban_user_by_email(email=email)