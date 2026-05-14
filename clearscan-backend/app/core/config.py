from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = "your-gemini-key-here"
    gemini_model: str = "gemini-2.5-flash"

    # App
    app_env: str = "development"
    app_port: int = 8000
    log_level: str = "info"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # Model
    model_name: str = "densenet121-res224-all"
    mc_dropout_passes: int = 10

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
