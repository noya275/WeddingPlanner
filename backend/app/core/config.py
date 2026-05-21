from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    App configuration. Defaults are used locally; override via environment variables or a .env file.
    """
    DATABASE_URL: str = "sqlite:///./wedding_planner.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALLOWED_ORIGINS: list[str] = ["*"]

    model_config = {"env_file": ".env"}


# Single instance imported everywhere — config is read once at startup, not per request.
settings = Settings()
