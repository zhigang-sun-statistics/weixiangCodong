from pydantic import BaseModel


class DependencyCreate(BaseModel):
    depends_on_id: int


class DependencyResponse(BaseModel):
    id: int
    task_id: int
    depends_on_id: int

    model_config = {"from_attributes": True}


class DependencyTreeNode(BaseModel):
    id: int
    title: str
    status: str
    dependencies: list["DependencyTreeNode"] = []


class CanCompleteResponse(BaseModel):
    can_complete: bool
    unfinished_dependencies: list[int] = []
