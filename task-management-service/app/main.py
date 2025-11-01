from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Dict, Optional
from enum import Enum
import os
from pathlib import Path
from dotenv import load_dotenv
import logging
import traceback

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


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
            status_code=401,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
        )

    token = parts[1]

    if not API_KEY:
        raise HTTPException(
            status_code=500, detail="API_KEY environment variable not configured"
        )

    if token != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return token


# Models
class Status(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN-PROGRESS"
    DONE = "DONE"
    ERROR = "ERROR"


class TaskReq(BaseModel):
    heading: str


class TaskResp(BaseModel):
    task_id: str
    input: Dict
    output: Dict | None = None
    status: Status


class TaskUpdateReq(BaseModel):
    task_id: str
    update: Dict


@app.get("/health")
def health():
    return "ok"


@app.post("/api/tasks", dependencies=[Depends(verify_api_key)])
def post_task(task_req: TaskReq) -> TaskResp:
    return TaskResp(
        task_id="task_001",
        input={"heading": task_req.heading},
        output=None,
        status=Status.TODO,
    )


@app.get("/api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
def get_task(task_id: str) -> TaskResp:
    return TaskResp(
        task_id=task_id,
        input={},
        output=None,
        status=Status.TODO,
    )


@app.put("/api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
def put_task(task_id: str, task_req: TaskUpdateReq) -> TaskResp:
    return TaskResp(
        task_id=task_id,
        input={},
        output=task_req.update,
        status=Status.DONE,
    )
