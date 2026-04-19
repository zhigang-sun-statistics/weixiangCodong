import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.ai_settings import AISettings
from app.models.task import Task
from app.ai.factory import get_provider
from app.ai.local_parser import parse_with_local
from app.ai.prompts import *
from app.schemas.ai import *
from app.utils.exceptions import AIServiceException


def _get_settings(db: Session) -> AISettings:
    settings = db.query(AISettings).first()
    if not settings:
        settings = AISettings(provider="openai", api_key="")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_ai_settings(db: Session) -> AISettingsResponse:
    settings = _get_settings(db)
    key_set = bool(settings.api_key)
    preview = None
    if settings.api_key:
        preview = "*" * (len(settings.api_key) - 4) + settings.api_key[-4:]
    return AISettingsResponse(
        provider=settings.provider,
        api_key_set=key_set,
        api_key_preview=preview,
    )


def update_ai_settings(db: Session, data: AISettingsUpdate) -> AISettingsResponse:
    settings = _get_settings(db)
    settings.provider = data.provider
    settings.api_key = data.api_key
    db.commit()
    return get_ai_settings(db)


async def _call_ai(db: Session, system_prompt: str, user_prompt: str) -> str:
    settings = _get_settings(db)
    provider = get_provider(settings.provider, settings.api_key)
    return await provider.complete(system_prompt, user_prompt)


async def parse_natural_language(db: Session, text: str) -> NLTaskParseResponse:
    today = datetime.now().strftime("%Y-%m-%d")
    user_prompt = f"Today is {today}.\n\nText: {text}"
    result = await _call_ai(db, PARSE_TASK_PROMPT, user_prompt)
    try:
        data = json.loads(result)
        return NLTaskParseResponse(**data)
    except (json.JSONDecodeError, Exception):
        raise AIServiceException("Failed to parse AI response for task creation")


async def smart_parse(db: Session, text: str) -> NLTaskParseResponse:
    """Try local rule-based parser first; fall back to LLM if confidence is low."""
    local_result = parse_with_local(text)

    if local_result.confidence >= 0.6:
        return NLTaskParseResponse(
            title=local_result.title,
            description=local_result.description,
            priority=local_result.priority,
            tags=local_result.tags,
            due_date=local_result.due_date,
            method="local",
        )

    # Fallback to cloud LLM
    return await parse_natural_language(db, text)


async def suggest_tags(db: Session, title: str, description: Optional[str]) -> TagSuggestionResponse:
    user_prompt = f"Title: {title}"
    if description:
        user_prompt += f"\nDescription: {description}"
    result = await _call_ai(db, TAG_SUGGESTION_PROMPT, user_prompt)
    try:
        tags = json.loads(result)
        return TagSuggestionResponse(tags=tags)
    except json.JSONDecodeError:
        raise AIServiceException("Failed to parse AI response for tag suggestion")


async def recommend_priority(
    db: Session, title: str, description: Optional[str]
) -> PriorityResponse:
    user_prompt = f"Title: {title}"
    if description:
        user_prompt += f"\nDescription: {description}"
    result = await _call_ai(db, PRIORITY_RECOMMENDATION_PROMPT, user_prompt)
    try:
        data = json.loads(result)
        return PriorityResponse(**data)
    except (json.JSONDecodeError, Exception):
        raise AIServiceException("Failed to parse AI response for priority recommendation")


async def breakdown_task(
    db: Session, title: str, description: Optional[str]
) -> BreakdownResponse:
    user_prompt = f"Title: {title}"
    if description:
        user_prompt += f"\nDescription: {description}"
    result = await _call_ai(db, BREAKDOWN_PROMPT, user_prompt)
    try:
        subtasks = json.loads(result)
        return BreakdownResponse(
            subtasks=[SubTaskItem(**s) for s in subtasks]
        )
    except (json.JSONDecodeError, Exception):
        raise AIServiceException("Failed to parse AI response for task breakdown")


async def summarize_tasks(db: Session, task_ids: Optional[list[int]]) -> SummarizeResponse:
    query = db.query(Task)
    if task_ids:
        query = query.filter(Task.id.in_(task_ids))
    tasks = query.all()

    if not tasks:
        return SummarizeResponse(summary="No tasks to summarize.")

    task_list = "\n".join(
        f"- [{t.status}] {t.title} (priority: {t.priority})"
        + (f" - {t.description}" if t.description else "")
        for t in tasks
    )
    result = await _call_ai(db, SUMMARIZE_PROMPT, task_list)
    return SummarizeResponse(summary=result)


async def detect_similar(db: Session, task_id: int) -> SimilarResponse:
    target = db.query(Task).filter(Task.id == task_id).first()
    if not target:
        from app.utils.exceptions import NotFoundException
        raise NotFoundException("Task", task_id)

    others = db.query(Task).filter(Task.id != task_id).all()
    if not others:
        return SimilarResponse(similar_tasks=[])

    task_list = f"TARGET: [id:{target.id}] {target.title}"
    if target.description:
        task_list += f" - {target.description}"
    task_list += "\n\nEXISTING TASKS:\n"
    for t in others:
        task_list += f"[id:{t.id}] {t.title}"
        if t.description:
            task_list += f" - {t.description}"
        task_list += "\n"

    result = await _call_ai(db, SIMILAR_PROMPT, task_list)
    try:
        items = json.loads(result)
        return SimilarResponse(
            similar_tasks=[SimilarItem(**item) for item in items]
        )
    except (json.JSONDecodeError, Exception):
        raise AIServiceException("Failed to parse AI response for similar detection")
