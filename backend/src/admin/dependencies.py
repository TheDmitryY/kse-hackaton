from src.admin.repository import AdminRepository
from src.admin.services import AdminService
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.config import get_async_session


async def get_admin_repository(
    session: AsyncSession = Depends(get_async_session),
) -> AdminRepository:
    return AdminRepository(session)


async def get_admin_service(
    repository: AdminRepository = Depends(get_admin_repository),
) -> AdminService:
    return AdminService(repository)

