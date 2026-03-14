from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.config import get_async_session
from src.auth.models import User
from src.auth.services import AuthService
from src.users.repository import UserRepository, PosgresUserRepository
from src.auth.utils import ArgonPasswordHasher, JwtTokenService
from src.auth.config import settings as auth_settings
from src.auth.constants import ACCESS_COOKIE_KEY
from jose import JWTError, jwt
from typing import Annotated, Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


async def get_current_user_claims(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
) -> dict[str, str | None]:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Prefer cookie, fall back to Authorization header
    cookie_token = request.cookies.get(ACCESS_COOKIE_KEY)
    effective_token = cookie_token or token

    if not effective_token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            effective_token,
            auth_settings.SECRET_KEY,
            algorithms=[auth_settings.ALGORITHM],
        )

        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None:
            raise credentials_exception

        return {"user_id": user_id, "role": role}

    except JWTError:
        raise credentials_exception


def role_required(role: str):
    async def role_checker(
        current_user: Annotated[dict, Depends(get_current_user_claims)],
    ):
        if current_user["role"] != role:
            raise HTTPException(
                status_code=403, detail="Operation not permitted, insufficient role"
            )
        return current_user

    return role_checker


async def get_user_repository(
    session: AsyncSession = Depends(get_async_session),
) -> UserRepository:
    return PosgresUserRepository(session)


async def get_auth_service(
    repo: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(
        user_repo=repo,
        password_hasher=ArgonPasswordHasher(),
        token_service=JwtTokenService(
            secret_key=auth_settings.SECRET_KEY,
            algorithm=auth_settings.ALGORITHM,
            expire_minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        ),
    )
