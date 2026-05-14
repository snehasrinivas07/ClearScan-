from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.inference import is_model_loaded
from app.services.report import is_llm_configured
from app.core.config import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse,
            summary="Backend health check")
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status       = "ok",
        model_loaded = is_model_loaded(),
        llm_ready    = is_llm_configured(),
        version      = "1.0.0",
        environment  = settings.app_env,
    )
