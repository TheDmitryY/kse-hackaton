from dishka import Provider, Scope, provide
from src.auth.config import settings as auth_settings
from src.auth.services import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.utils import (
    ArgonPasswordHasher,
    PasswordService,
    JwtTokenService,
    TokenService
)
from src.users.repository import UserRepository, PosgresUserRepository

class AppProvider(Provider):
    @provide(scope=Scope.APP)
    def get_hasher(self) -> PasswordService:
        return ArgonPasswordHasher()

    @provide(scope=Scope.APP)
    def get_tokens(self) -> TokenService:
        return JwtTokenService(secret_key=auth_settings.SECRET_KEY,algorithm=auth_settings.ALGORITHM,expire_minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    @provide(scope=Scope.REQUEST)
    def get_repo(self, session: AsyncSession) -> UserRepository:
        return PosgresUserRepository(session)

    @provide(scope=Scope.REQUEST)
    def get_auth_service(
        self,
        user_repo: UserRepository,
        passsword_service: PasswordService,
        token_service: TokenService
    ) -> AuthService:
        return AuthService(
            user_repo=user_repo,
            password_hasher=passsword_service,
            token_service=token_service
        )