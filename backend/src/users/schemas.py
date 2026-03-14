from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from dataclasses import dataclass
import uuid

class ResponseUserDTO(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    username: str | None
    avatar_url: str | None = None
    
    model_config = ConfigDict(from_attributes=True,extra='forbid')

class UserUpdateDTO(BaseModel):
    email: EmailStr
    username: str

@dataclass
class UserEntity:
    id: uuid.UUID | None
    email: str
    username: str | None
    hashed_password: str | None
    role: str = "quest"