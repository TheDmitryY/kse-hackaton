from src.users.services import UserService
from src.auth.dependencies import get_user_repository
from src.users.repository import UserRepository
from src.auth.utils import PasswordService, ArgonPasswordHasher
from src.auth.models import User
from fastapi import Depends

async def get_user_service(
    repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    return UserService(user_repo=repo, password_hasher=ArgonPasswordHasher())

async def get_current_user() -> User:
    raise NotImplementedError("get_current_user is not yet implemented")