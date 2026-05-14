import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers import analyse, report, health
from app.services.inference import load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"Starting ClearScan AI | env={settings.app_env}")
    loaded = load_model(settings.model_name)
    if loaded:
        logger.info("AI model loaded")
    else:
        logger.warning("Model failed to load — /analyse will return 503")
    if is_gemini_ready(settings):
        logger.info("Gemini API key configured")
    else:
        logger.warning("Gemini key not set — /report will use fallback")
    yield
    logger.info("Shutting down")


def is_gemini_ready(settings) -> bool:
    return bool(settings.gemini_api_key and
                settings.gemini_api_key != "your-gemini-key-here")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="ClearScan AI API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, tags=["System"])
    app.include_router(analyse.router, tags=["Inference"])
    app.include_router(report.router, tags=["Report"])

    @app.get("/", include_in_schema=False)
    async def root():
        return {"service": "ClearScan AI", "version": "1.0.0",
                "status": "running", "docs": "/docs"}

    return app


app = create_app()
