from pydantic import BaseModel
import uuid

class BanUserDTO(BaseModel):
    user_id: uuid.UUID

class ResponseBanUserDto(BaseModel):
    pass