from pydantic import BaseModel, EmailStr, Field

class UserBaseDTO(BaseModel):
    email: EmailStr
    password: str

class TokenDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AuthResultDTO(BaseModel):
    access_token: str
    refresh_token: str

class LoginUserDTO(UserBaseDTO):
    pass

class CreateUserDTO(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3,max_length=50)
    password: str = Field(..., min_length=8)
    roles: str = "quest"

class ForgotUserDTO(BaseModel):
    email: EmailStr

class VerifyForgotUserDTOs(BaseModel):
    token: str
    password: str