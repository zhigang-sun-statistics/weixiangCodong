import json
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from app.models.task import Task
from app.models.dependency import TaskDependency
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    SortBy,
    SortOrder,
)
from app.services.cache import get_cached, set_cached, invalidate_task, _make_key
from app.utils.exceptions import NotFoundException, ValidationException, DependencyException


def _fts_search(query: Session, search: str):
    """Try FTS5 search; return task IDs or None if FTS unavailable."""
    try:
        escaped = search.replace('"', '""')
        rows = query.execute(
            text("SELECT rowid FROM tasks_fts WHERE tasks_fts MATCH :q"),
            {"q": f'"{escaped}"'},
        ).fetchall()
        return [r[0] for r in rows]
    except Exception:
        return None


def create_task(db: Session, data: TaskCreate) -> TaskResponse:
    task = Task(
        title=data.title,
        description=data.description,
        status=data.status.value,
        priority=data.priority.value,
        due_date=data.due_date,
    )
    if data.tags:
        task.set_tags(data.tags)
    db.add(task)
    db.commit()
    db.refresh(task)
    invalidate_task()
    return TaskResponse.from_task(task)


def get_task(db: Session, task_id: int) -> TaskResponse:
    cache_key = f"task:{task_id}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    result = TaskResponse.from_task(task)
    set_cached(cache_key, result)
    return result


def list_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    page_size: int = 10,
) -> TaskListResponse:
    cache_key = _make_key(
        "tasks",
        status=status,
        priority=priority,
        tags=tags,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    cached = get_cached(cache_key)
    if cached:
        return cached

    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        conditions = [Task.tags.contains(json.dumps(t)) for t in tag_list]
        query = query.filter(or_(*conditions))
    if search:
        fts_ids = _fts_search(db, search)
        if fts_ids is not None and fts_ids:
            query = query.filter(Task.id.in_(fts_ids))
        elif fts_ids is not None and len(fts_ids) == 0:
            # FTS returned no results
            query = query.filter(Task.id < 0)
        else:
            # FTS unavailable, fallback to ILIKE
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term),
                )
            )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    sort_column = getattr(Task, sort_by, Task.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    offset = (page - 1) * page_size
    tasks = query.offset(offset).limit(page_size).all()

    result = TaskListResponse(
        items=[TaskResponse.from_task(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
    set_cached(cache_key, result)
    return result


def update_task(db: Session, task_id: int, data: TaskUpdate) -> TaskResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    if data.status and data.status.value == "completed":
        unfinished = _check_unfinished_dependencies(db, task_id)
        if unfinished:
            raise DependencyException(
                f"Cannot complete task: dependencies {unfinished} are not done"
            )

    update_data = data.model_dump(exclude_unset=True)
    if "tags" in update_data:
        task.set_tags(update_data.pop("tags"))
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    if "priority" in update_data:
        update_data["priority"] = update_data["priority"].value

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    invalidate_task(task_id)
    return TaskResponse.from_task(task)


def delete_task(db: Session, task_id: int):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)
    db.delete(task)
    db.commit()
    invalidate_task(task_id)


def update_status(db: Session, task_id: int, status: str) -> TaskResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    if status == "completed":
        unfinished = _check_unfinished_dependencies(db, task_id)
        if unfinished:
            raise DependencyException(
                f"Cannot complete task: dependencies {unfinished} are not done"
            )

    task.status = status
    db.commit()
    db.refresh(task)
    invalidate_task(task_id)
    return TaskResponse.from_task(task)


def _check_unfinished_dependencies(db: Session, task_id: int) -> list[int]:
    deps = (
        db.query(TaskDependency.depends_on_id)
        .filter(TaskDependency.task_id == task_id)
        .all()
    )
    dep_ids = [d[0] for d in deps]
    if not dep_ids:
        return []

    unfinished = (
        db.query(Task.id)
        .filter(Task.id.in_(dep_ids), Task.status != "completed")
        .all()
    )
    return [t[0] for t in unfinished]


def export_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
) -> list[TaskResponse]:
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        conditions = [Task.tags.contains(json.dumps(t)) for t in tag_list]
        query = query.filter(or_(*conditions))
    if search:
        fts_ids = _fts_search(db, search)
        if fts_ids is not None and fts_ids:
            query = query.filter(Task.id.in_(fts_ids))
        elif fts_ids is not None and len(fts_ids) == 0:
            query = query.filter(Task.id < 0)
        else:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term),
                )
            )

    tasks = query.order_by(Task.created_at.desc()).all()
    return [TaskResponse.from_task(t) for t in tasks]
