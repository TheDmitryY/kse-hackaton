from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,delete, update
from src.auth.schemas import CreateUserDTO
from src.users.schemas import UserUpdateDTO, UserEntity, ResponseUserDTO
from src.auth.models import User
from src.users.exceptions import DataAccessException
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger
import uuid
from typing import (
    Optional,List
    )
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> ResponseUserDTO | None:
        pass

    @abstractmethod
    async def get_by_id(self, user_id: uuid.UUID) -> ResponseUserDTO | None:
        pass

    @abstractmethod
    async def create(self, user: UserEntity) -> ResponseUserDTO:
        pass

    @abstractmethod
    async def update(self, user: UserEntity) -> ResponseUserDTO:
        pass

    @abstractmethod
    async def delete(self, user_id: uuid.UUID) -> None:
        pass

    @abstractmethod
    async def get_by_email_with_password(self, email: str) -> UserEntity | None:
        pass

    @abstractmethod
    async def update_avatar_key(self, user_id: uuid.UUID, avatar_key: str) -> None:
        pass

class PosgresUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> ResponseUserDTO | None:
        query = (
            select(User)
            .where(User.email == email)
            )
        result = await self.session.execute(query)
        user_model = result.scalar_one_or_none()

        if user_model:
            return self._map_to_domain(user_model)
        return None
        
    async def get_by_id(self, user_id: uuid.UUID) -> ResponseUserDTO | None:
        logger.debug(f"Executing DB query to fetch user_id={user_id}")
        query = (
            select(User)
            .where(User.id == user_id)
        )
        try:
            result = await self.session.execute(query)
            user_model = result.scalar_one_or_none()
            if user_model:
                return self._map_to_domain(user_model)
            return None
        except SQLAlchemyError as e:
            logger.error(f"Database error while fetching user {user_id}")
            raise DataAccessException("Failed to fetch user due to DB error") from e
    
    async def create(self, user: UserEntity) -> ResponseUserDTO:
        user_model = User(
            email = user.email,
            hashed_password = user.hashed_password,
            username = user.username,
            role = "quest"
        )
        self.session.add(user_model)
        await self.session.flush()
        await self.session.refresh(user_model)
        await self.session.commit()

        return self._map_to_domain(user_model)

    async def update(self, user: UserEntity) -> ResponseUserDTO:
        stmt = (
            update(User)
            .where(User.id == user.id)
            .values(email=user.email, username=user.username)
            .returning(User)
        )
        result = await self.session.execute(stmt)
        updated_model = result.scalar_one()
        await self.session.commit()
        return self._map_to_domain(updated_model)
    
    async def delete(self, user_id: uuid.UUID) -> None:
        query = (
            delete(User)
            .where(User.id == user_id)
        )
        await self.session.execute(query)
        await self.session.commit()
    
    def _map_to_domain(self, model: User) -> ResponseUserDTO:
        return ResponseUserDTO(
            id=model.id,
            email=model.email,
            username=model.username,
            role=model.role
        )

    async def get_by_email_with_password(self, email: str) -> UserEntity | None:
        query = (
            select(User)
            .where(User.email == email)
        )
        result = await self.session.execute(query)
        user_model = result.scalar_one_or_none()

        if user_model:
            return UserEntity(
                id=user_model.id,
                email=user_model.email,
                username=user_model.username,
                hashed_password=user_model.hashed_password,
                role=user_model.role
            )
        return None

    async def update_avatar_key(self, user_id: uuid.UUID, avatar_key: str) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(avatar_url=avatar_key)
        )
        await self.session.execute(stmt)
        await self.session.commit()