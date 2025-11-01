from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # API Configuration
    api_key: str

    # Database Configuration
    database_url: str
    alembic_db_url: str

    # GCP Configuration
    gcp_project_id: str
    gcp_pubsub_topic: str
    gcp_pubsub_subscription: str
    google_application_credentials: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create a singleton instance
settings = Settings()
