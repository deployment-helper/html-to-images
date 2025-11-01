from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import os
from dotenv import load_dotenv
import logging
import traceback
from sqlmodel import select
from app.db.db import get_session
from app.models.task import Task
from app.services.pubsub import PubSub, get_pubsub

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.db import init_db

    await init_db()
    yield
    logger.info("Shuting down..")


app = FastAPI(title="Async Task Manager", lifespan=lifespan)


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent response format"""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": str(request.url.path),
        },
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors"""
    logger.error(f"Validation Error: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "message": "Request validation failed",
            "details": exc.errors(),
            "path": str(request.url.path),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.exception(f"Unhandled Exception: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "Internal server error",
            "path": str(request.url.path),
        },
    )


# Get API key from environment variable
API_KEY = os.getenv("API_KEY")


# Function-based middleware dependency for API key authentication
def verify_api_key(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify API key from Authorization header.
    Expected format: Bearer <api_key>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
        )

    token = parts[1]

    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_KEY environment variable not configured",
        )

    if token != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return token


# Models


class TaskReq(BaseModel):
    heading: str


class TaskUpdateReq(BaseModel):
    task_id: str
    update: Dict


@app.get("/health")
def health():
    return "ok"


@app.post(
    "/api/tasks",
    dependencies=[Depends(verify_api_key)],
)
async def post_task(
    task_req: TaskReq,
    session: AsyncSession = Depends(get_session),
    pubsub_client: PubSub = Depends(get_pubsub),
) -> Task:
    task = Task(input={"heading": task_req.heading})
    session.add(task)
    await session.commit()
    result = await pubsub_client.publish_msg(task.model_dump_json())
    logger.info(f"message-id {result}")
    return task


@app.get("/api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
async def get_task(task_id: str, session: AsyncSession = Depends(get_session)) -> Task:
    statement = select(Task).where(Task.id == task_id)
    result = await session.execute(statement)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return row.Task


@app.put("/api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
async def put_task(
    task_id: str, task_req: TaskUpdateReq, session: AsyncSession = Depends(get_session)
) -> Task:
    statement = select(Task).where(Task.id == task_id)
    result = await session.execute(statement)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    task = row.Task
    task.output = (task.output or {}) | task_req.update
    session.add(task)
    await session.commit()
    return task
