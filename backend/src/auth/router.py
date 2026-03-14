from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    Response
    )
from fastapi.security import OAuth2PasswordRequestForm
from src.auth.schemas import (
    TokenDTO,
    CreateUserDTO,
    LoginUserDTO
    )

from dishka.integrations.fastapi import (
    FromDishka, inject, setup_dishka,
)

from src.users.schemas import ResponseUserDTO
from src.auth.services import AuthService
from src.users.services import UserService
from src.auth.dependencies import get_auth_service, get_current_user_claims
from src.users.dependencies import get_user_service
from src.auth.constants import (
    COOKIE_KEY,
    COOKIE_MAX_AGE,
    ACCESS_COOKIE_KEY,
    ACCESS_COOKIE_MAX_AGE
)
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


router = APIRouter()


@router.post("/register", response_model=ResponseUserDTO)
@inject
async def register(
    body: CreateUserDTO,
    service: FromDishka[AuthService]
):
    return await service.register_user(user_dto=body)


@router.post("/login")
@inject
async def login(
    login_data: LoginUserDTO,
    response: Response,
    service: FromDishka[AuthService]
):
    token = await service.login_user(login_data.email, login_data.password)
    response.set_cookie(
        key=ACCESS_COOKIE_KEY,
        value=token,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_COOKIE_MAX_AGE,
        path="/",
    )
    return {"message": "Login successful"}


@router.post("/token")
@inject
async def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = None,
    service: FromDishka[AuthService] = None,
):
    token = await service.login_user(form_data.username, form_data.password)
    response.set_cookie(
        key=ACCESS_COOKIE_KEY,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_COOKIE_MAX_AGE,
        path="/",
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post(
    "/refresh-token",
    response_model=TokenDTO,
    deprecated=True
    )
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=COOKIE_KEY),
    service: AuthService = Depends(get_auth_service)
):
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token mising"
        )
    
    auth_result = await service.refresh_session(refresh_token)
    response.set_cookie(
        key=COOKIE_KEY,
        value=auth_result.refresh_token,
        httponly=True,
        secure=False, ## In prod should be True
        samesite="lax",
        max_age=COOKIE_MAX_AGE
    )
    return TokenDTO(access_token=auth_result.access_token)

@router.post("/logout")
@inject
async def logout(
    response: Response,
    service: FromDishka[AuthService]
    ):
    response.delete_cookie(
        key=ACCESS_COOKIE_KEY,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return await service.logout_user(response=response)


@router.get("/me")
async def get_me(claims: dict = Depends(get_current_user_claims)):
    return {"user_id": claims["user_id"], "role": claims["role"]}