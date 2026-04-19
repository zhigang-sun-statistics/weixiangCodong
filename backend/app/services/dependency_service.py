from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.dependency import TaskDependency
from app.schemas.dependency import (
    DependencyResponse,
    DependencyTreeNode,
    CanCompleteResponse,
)
from app.utils.exceptions import NotFoundException, DependencyException


def add_dependency(db: Session, task_id: int, depends_on_id: int) -> DependencyResponse:
    if task_id == depends_on_id:
        raise DependencyException("A task cannot depend on itself")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)
    dep_task = db.query(Task).filter(Task.id == depends_on_id).first()
    if not dep_task:
        raise NotFoundException("Task", depends_on_id)

    existing = (
        db.query(TaskDependency)
        .filter(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_id == depends_on_id,
        )
        .first()
    )
    if existing:
        raise DependencyException("Dependency already exists")

    if _would_create_cycle(db, task_id, depends_on_id):
        raise DependencyException("Adding this dependency would create a cycle")

    dep = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return DependencyResponse(id=dep.id, task_id=dep.task_id, depends_on_id=dep.depends_on_id)


def remove_dependency(db: Session, task_id: int, dep_id: int):
    dep = (
        db.query(TaskDependency)
        .filter(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_id == dep_id,
        )
        .first()
    )
    if not dep:
        raise NotFoundException("Dependency", f"{task_id}->{dep_id}")
    db.delete(dep)
    db.commit()


def get_dependencies(db: Session, task_id: int) -> list[DependencyResponse]:
    deps = (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task_id)
        .all()
    )
    return [
        DependencyResponse(id=d.id, task_id=d.task_id, depends_on_id=d.depends_on_id)
        for d in deps
    ]


def get_dependency_tree(db: Session, task_id: int) -> DependencyTreeNode:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    visited = set()

    def build_node(tid: int) -> DependencyTreeNode:
        if tid in visited:
            return DependencyTreeNode(id=tid, title="...", status="...", dependencies=[])
        visited.add(tid)

        t = db.query(Task).filter(Task.id == tid).first()
        deps = (
            db.query(TaskDependency)
            .filter(TaskDependency.task_id == tid)
            .all()
        )
        children = [build_node(d.depends_on_id) for d in deps]
        return DependencyTreeNode(
            id=tid, title=t.title, status=t.status, dependencies=children
        )

    return build_node(task_id)


def can_complete(db: Session, task_id: int) -> CanCompleteResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    deps = (
        db.query(TaskDependency.depends_on_id)
        .filter(TaskDependency.task_id == task_id)
        .all()
    )
    dep_ids = [d[0] for d in deps]
    if not dep_ids:
        return CanCompleteResponse(can_complete=True, unfinished_dependencies=[])

    unfinished = (
        db.query(Task.id)
        .filter(Task.id.in_(dep_ids), Task.status != "completed")
        .all()
    )
    unfinished_ids = [t[0] for t in unfinished]
    return CanCompleteResponse(
        can_complete=len(unfinished_ids) == 0,
        unfinished_dependencies=unfinished_ids,
    )


def _would_create_cycle(db: Session, task_id: int, depends_on_id: int) -> bool:
    visited = set()
    stack = [depends_on_id]
    while stack:
        current = stack.pop()
        if current == task_id:
            return True
        if current in visited:
            continue
        visited.add(current)
        deps = (
            db.query(TaskDependency.depends_on_id)
            .filter(TaskDependency.task_id == current)
            .all()
        )
        stack.extend(d[0] for d in deps)
    return False
