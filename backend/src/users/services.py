from fastapi import Depends, HTTPException
from src.users.repository import UserRepository
from src.auth.schemas import CreateUserDTO
from src.users.schemas import ResponseUserDTO, UserEntity
from src.users.utils import mask_email
from src.users.exceptions import RegistrationFailedException
from src.auth.utils import PasswordService
from loguru import logger
from typing import List
import uuid

class UserService:
    def __init__(self, user_repo: UserRepository, password_hasher: PasswordService):
        self.user_repo = user_repo
        self.password_hasher = password_hasher

    async def register_user(self, user_dto: CreateUserDTO) -> ResponseUserDTO:
        safe_mail = mask_email(email=user_dto.email)
        logger.info(f"Starting registration process for user {safe_mail}")
        if await self.user_repo.get_by_email(user_dto.email):
            logger.warning(f"Registration failed: User {safe_mail} alreay exists")
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )

        hashed_password = self.password_hasher.hash(user_dto.password)
        try:

            user_entity = UserEntity(
                id=None,
                email=user_dto.email,
                username=user_dto.username,
                hashed_password=hashed_password,
                role="quest",
            )

            new_user = await self.user_repo.create(user_entity)
            logger.info(
                "User succesfully registered",
                extra={
                    "user_id": new_user.id,
                    "masked_email": safe_mail
                }
            )
            return new_user
        except Exception as e:
            logger.error(f"Failed to save user {safe_mail} to database: {str(e)}")
            raise RegistrationFailedException() from e
        

    async def get_user_profile(self, user_id: uuid.UUID) -> ResponseUserDTO:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return user

    async def delete_user(self, user_id: uuid.UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        await self.user_repo.delete(user_id)
