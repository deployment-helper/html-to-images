from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from typing import AsyncGenerator
from os import getenv

from dotenv import load_dotenv

load_dotenv()

# Database URL (replace with your PostgreSQL credentials)
DATABASE_URL = getenv("DATABASE_URL")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Dependency to provide session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


# Function to initialize database tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
