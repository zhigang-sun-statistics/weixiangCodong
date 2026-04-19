from fastapi import APIRouter
from app.api.tasks import router as tasks_router
from app.api.dependencies import router as dependencies_router
from app.api.ai import router as ai_router
from app.api.auth import router as auth_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(dependencies_router, prefix="/tasks", tags=["Dependencies"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])


@api_router.get("/health")
async def health_check():
    return {"status": "ok", "service": "task-management-system"}
