from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Optional
from enum import Enum
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI()

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


@app.post("api/tasks", dependencies=[Depends(verify_api_key)])
def post_task(task_req: TaskReq) -> TaskResp:
    return f"POST task req {task_req}"


@app.get("api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
def get_task(task_id: str) -> TaskResp:
    return f"Task id {task_id}"


@app.put("api/tasks/{task_id}", dependencies=[Depends(verify_api_key)])
def put_task(task_id: str, task_req: TaskUpdateReq) -> TaskResp:
    return f"Task id {task_id}, task update req {task_req}"
