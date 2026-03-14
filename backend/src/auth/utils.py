from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from abc import ABC, abstractmethod
from src.auth.exceptions import (
    InvalidTokenException,
    InvalidRefreshTokenException
    )
import time
import uuid
from jose import jwt
from src.auth.config import settings as auth_settings

class PasswordService(ABC):
    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        pass
        
    @abstractmethod
    def hash(self, password: str) -> str:
        pass

class TokenService(ABC):
    @abstractmethod
    def create_access_token(self, user_id: uuid.UUID, role: str) -> str:
        pass

    @abstractmethod
    def create_refresh_token(self, user_id: uuid.UUID) -> str:
        pass 
    
    @abstractmethod
    def verify_token(self, token: str) -> dict[str, str]:
        pass

class ArgonPasswordHasher(PasswordService):
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

class JwtTokenService(TokenService):
    def __init__(self, secret_key: str, algorithm: str, expire_minutes: int):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expire_minutes = expire_minutes

    def create_access_token(self, user_id: uuid.UUID, role: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = (
            {
                "sub": str(user_id),
                "role": role,
                "iat": time.time(),
                "exp": expire,
                "type": "access"
                }
            )

        return jwt.encode(
            payload,
            auth_settings.SECRET_KEY,
            algorithm=auth_settings.ALGORITHM
        )
    def create_refresh_token(self, user_id: uuid.UUID) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = (
            {
                "sub": str(user_id),
                "iat": time.time(),
                "exp": expire,
                "type": "refresh"
                }
            )

        return jwt.encode(
            payload,
            auth_settings.SECRET_KEY,
            algorithm=auth_settings.ALGORITHM
        )

    def verify_token(self, token: str) -> dict[str, str]:
        try:
            payload = jwt.decode(token, auth_settings.SECRET_KEY, algorithms=[auth_settings.ALGORITHM])
            return payload
        except jwt.JWTError:
            raise InvalidTokenException("Invalid Token")