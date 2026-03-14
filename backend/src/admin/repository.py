from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,delete, update
from src.auth.schemas import CreateUserDTO
from src.users.schemas import UserUpdateDTO 
from src.auth.models import User
from src.admin.exceptions import NotFoundException
import uuid
from typing import (
    Optional
    )
from collections.abc import Sequence


class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        query = (
            select(User)
            .where(User.id == user_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int, limit: int) -> Sequence[User]:
        query = (
            select(User)
            .limit(limit)
            .offset(skip)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        query = (
            select(User)
            .where(User.email == email)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def ban_user(self, user_id: uuid.UUID) -> User | None:
        user = await self.get_by_id(user_id=user_id)
        query = (
            update(User)
            .where(User.id == user_id)
            .values(role="banned")
            .returning(User)
        )
        result = await self.session.execute(query)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def unban_user(self, user_id: uuid.UUID) -> User | None:
        user = await self.get_by_id(user_id=user_id)
        query = (
            update(User)
            .where(User.id == user_id)
            .values(role="user")
            .returning(User)
        )
        result = await self.session.execute(query)
        await self.session.commit()
        return result.scalar_one_or_none()

    async def unban_user_by_email(self, email: str) -> User | None:
        user = await self.get_by_email(email=email)
        query = (
            update(User)
            .where(User.email == email)
            .values(role="user")
            .returning(User)
        )
        result = await self.session.execute(query)
        await self.session.commit()
        return result.scalar_one_or_none()

    async def get_banned_user(self, user_id: uuid.UUID) -> User | None:
        query = (
            select(User)
            .where(
                User.role == "banned",
                User.id == user_id
                )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_banned_users(self, limit: int, skip: int) -> Sequence[User]:
        query = (
            select(User)
            .where(
                User.role == "banned"
                )
            .limit(limit)
            .offset(skip)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def ban_user_by_email(self, email: str) -> User | None:
        user = await self.get_by_email(email=email)
        query = (
            update(User)
            .where(User.email == email)
            .values(role="banned")
            .returning(User)
        )
        result = await self.session.execute(query)
        await self.session.commit()
        return result.scalar_one_or_none()