from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.ai import (
    NLTaskParseRequest,
    NLTaskParseResponse,
    TagSuggestionRequest,
    TagSuggestionResponse,
    PriorityRequest,
    PriorityResponse,
    BreakdownRequest,
    BreakdownResponse,
    SummarizeRequest,
    SummarizeResponse,
    SimilarRequest,
    SimilarResponse,
    AISettingsResponse,
    AISettingsUpdate,
)
from app.services import ai_service

router = APIRouter()


@router.get("/settings", response_model=AISettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return ai_service.get_ai_settings(db)


@router.put("/settings", response_model=AISettingsResponse)
def update_settings(data: AISettingsUpdate, db: Session = Depends(get_db)):
    return ai_service.update_ai_settings(db, data)


@router.post("/parse-task", response_model=NLTaskParseResponse)
async def parse_task(data: NLTaskParseRequest, db: Session = Depends(get_db)):
    return await ai_service.parse_natural_language(db, data.text)


@router.post("/suggest-tags", response_model=TagSuggestionResponse)
async def suggest_tags(data: TagSuggestionRequest, db: Session = Depends(get_db)):
    return await ai_service.suggest_tags(db, data.title, data.description)


@router.post("/recommend-priority", response_model=PriorityResponse)
async def recommend_priority(data: PriorityRequest, db: Session = Depends(get_db)):
    return await ai_service.recommend_priority(db, data.title, data.description)


@router.post("/breakdown-task", response_model=BreakdownResponse)
async def breakdown_task(data: BreakdownRequest, db: Session = Depends(get_db)):
    return await ai_service.breakdown_task(db, data.title, data.description)


@router.post("/summarize-tasks", response_model=SummarizeResponse)
async def summarize_tasks(data: SummarizeRequest, db: Session = Depends(get_db)):
    return await ai_service.summarize_tasks(db, data.task_ids)


@router.post("/detect-similar", response_model=SimilarResponse)
async def detect_similar(data: SimilarRequest, db: Session = Depends(get_db)):
    return await ai_service.detect_similar(db, data.task_id)
