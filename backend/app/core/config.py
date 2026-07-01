from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "Kozmocart ERP"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-in-production"

    DATABASE_URL: str = "postgresql+asyncpg://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db"
    DATABASE_URL_SYNC: str = "postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # Razorpay Settings
    RAZORPAY_KEY_ID: str = "rzp_test_demokey12345"
    RAZORPAY_KEY_SECRET: str = "placeholder_secret"
    RAZORPAY_WEBHOOK_SECRET: str = "placeholder_webhook_secret"

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Kozmocart"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://teqmates.com",
        "http://teqmates.com",
        "https://www.teqmates.com",
        "http://www.teqmates.com",
    ]

    FIRST_SUPERADMIN_EMAIL: str = "admin@kozmocart.in"
    FIRST_SUPERADMIN_PASSWORD: str = "Admin@2026!"
    FIRST_SUPERADMIN_NAME: str = "Kozmocart Admin"


settings = Settings()
