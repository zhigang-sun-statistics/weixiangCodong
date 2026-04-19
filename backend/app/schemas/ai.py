from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NLTaskParseRequest(BaseModel):
    text: str


class NLTaskParseResponse(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[list[str]] = None
    due_date: Optional[str] = None
    method: str = "llm"


class TagSuggestionRequest(BaseModel):
    title: str
    description: Optional[str] = None


class TagSuggestionResponse(BaseModel):
    tags: list[str]


class PriorityRequest(BaseModel):
    title: str
    description: Optional[str] = None


class PriorityResponse(BaseModel):
    priority: str
    reason: str


class BreakdownRequest(BaseModel):
    title: str
    description: Optional[str] = None


class SubTaskItem(BaseModel):
    title: str
    description: Optional[str] = None


class BreakdownResponse(BaseModel):
    subtasks: list[SubTaskItem]


class SummarizeRequest(BaseModel):
    task_ids: Optional[list[int]] = None


class SummarizeResponse(BaseModel):
    summary: str


class SimilarRequest(BaseModel):
    task_id: int


class SimilarItem(BaseModel):
    task_id: int
    title: str
    similarity_reason: str


class SimilarResponse(BaseModel):
    similar_tasks: list[SimilarItem]


class AISettingsResponse(BaseModel):
    provider: str
    api_key_set: bool
    api_key_preview: Optional[str] = None


class AISettingsUpdate(BaseModel):
    provider: str
    api_key: str
