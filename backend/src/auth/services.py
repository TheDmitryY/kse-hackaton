from src.users.repository import UserRepository
from fastapi.responses import JSONResponse, Response
from fastapi.encoders import jsonable_encoder
from src.users.schemas import UserEntity
from src.auth.schemas import (
    CreateUserDTO,
    TokenDTO,
    LoginUserDTO,
    AuthResultDTO
    )
from src.users.schemas import ResponseUserDTO
from src.auth.utils import PasswordService, TokenService
from src.auth.constants import COOKIE_KEY
from fastapi import HTTPException
import uuid

class AuthService:
    def __init__(
    self,
    user_repo: UserRepository,
    password_hasher: PasswordService,
    token_service: TokenService
    ):
        self.user_repo = user_repo
        self.password_hasher = password_hasher
        self.token_service = token_service

    async def register_user(self, user_dto: CreateUserDTO) -> ResponseUserDTO:
        user = await self.user_repo.get_by_email(email=user_dto.email)
        if user:
            raise HTTPException(
                status_code=409,
                detail="User with this email already exists"
            )
        
        hashed_password = self.password_hasher.hash(user_dto.password)

        new_user = UserEntity(
            id=None,  # Let the database auto-generate the UUID
            email=user_dto.email,
            hashed_password=hashed_password,
            username=user_dto.username,
            role="quest"
        )

        saved_user = await self.user_repo.create(new_user)
        return saved_user

    async def login_user(self, email: str, password: str) -> str:
        user = await self.user_repo.get_by_email_with_password(email=email)
        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=409,
                detail="Invalid credentials"
            )
        if not self.password_hasher.verify_password(plain_password=password, hashed_password=user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )
        if not user.id:
            raise HTTPException(
                status_code=500,
                detail="User ID is missing"
            )
        token = self.token_service.create_access_token(user_id=user.id, role=user.role)
        return token

    async def logout_user(self, response: Response):
        response.delete_cookie(
        key=COOKIE_KEY,
        httponly=True,
        secure=True,
        samesite="lax"
    )
        return {"message": "Logged out"}

    async def refresh_session(self, refresh_token: str) -> AuthResultDTO:
        raise NotImplementedError("refresh_session is not yet implemented")