from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dependency import (
    DependencyCreate,
    DependencyResponse,
    DependencyTreeNode,
    CanCompleteResponse,
)
from app.services import dependency_service

router = APIRouter()


@router.post("/{task_id}/dependencies", response_model=DependencyResponse, status_code=201)
def add_dependency(
    task_id: int, data: DependencyCreate, db: Session = Depends(get_db)
):
    return dependency_service.add_dependency(db, task_id, data.depends_on_id)


@router.get("/{task_id}/dependencies", response_model=list[DependencyResponse])
def get_dependencies(task_id: int, db: Session = Depends(get_db)):
    return dependency_service.get_dependencies(db, task_id)


@router.delete("/{task_id}/dependencies/{dep_id}", status_code=204)
def remove_dependency(task_id: int, dep_id: int, db: Session = Depends(get_db)):
    dependency_service.remove_dependency(db, task_id, dep_id)


@router.get("/{task_id}/dependency-tree", response_model=DependencyTreeNode)
def get_dependency_tree(task_id: int, db: Session = Depends(get_db)):
    return dependency_service.get_dependency_tree(db, task_id)


@router.get("/{task_id}/can-complete", response_model=CanCompleteResponse)
def can_complete(task_id: int, db: Session = Depends(get_db)):
    return dependency_service.can_complete(db, task_id)
