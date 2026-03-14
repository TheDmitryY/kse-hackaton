from typing import AsyncIterable

from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

class DatabaseProvider(Provider):
    def __init__(self, DATABASE_URL: str):
        super().__init__()
        self.database_url = DATABASE_URL

    @provide(scope=Scope.APP)
    async def get_engine(self) -> AsyncIterable[AsyncEngine]:
        engine = create_async_engine(self.database_url, echo=True)
        yield engine        
        await engine.dispose()

    @provide(scope=Scope.APP)
    def get_session_maker(self, engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
        return async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

    @provide(scope=Scope.REQUEST)
    async def get_session(
        self, session_maker: async_sessionmaker[AsyncSession]
    ) -> AsyncIterable[AsyncSession]:
        async with session_maker() as session:
            yield session