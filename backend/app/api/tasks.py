import csv
import io
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    StatusUpdate,
)
from app.services import task_service

router = APIRouter()


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    return task_service.create_task(db, data)


@router.get("", response_model=TaskListResponse)
def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return task_service.list_tasks(
        db, status, priority, tags, search, sort_by, sort_order, page, page_size
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return task_service.get_task(db, task_id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    return task_service.update_task(db, task_id, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task_service.delete_task(db, task_id)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_status(task_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    return task_service.update_status(db, task_id, data.status.value)


@router.get("/export/all")
def export_tasks(
    format: str = Query("csv", pattern="^(csv|json)$"),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    tasks = task_service.export_tasks(db, status, priority, tags, search)

    if format == "json":
        content = json.dumps(
            [t.model_dump() for t in tasks],
            ensure_ascii=False,
            indent=2,
            default=str,
        )
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=tasks.json"},
        )

    buf = io.StringIO()
    writer = csv.DictWriter(
        buf,
        fieldnames=["id", "title", "description", "status", "priority", "tags", "due_date", "created_at", "updated_at"],
    )
    writer.writeheader()
    for t in tasks:
        writer.writerow({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "priority": t.priority,
            "tags": ",".join(t.tags) if t.tags else "",
            "due_date": t.due_date or "",
            "created_at": t.created_at,
            "updated_at": t.updated_at,
        })
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks.csv"},
    )
