from typing import List, Optional, TYPE_CHECKING
import datetime
import uuid

from sqlalchemy import String, Text, ForeignKey, DateTime, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.config import Base

if TYPE_CHECKING:
    from src.posts.models import Post


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String, unique=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="guest")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # posts: Mapped[List["Post"]] = relationship("Post", back_populates="author", cascade="all, delete-orphan")