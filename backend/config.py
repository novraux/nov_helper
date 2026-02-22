from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://novraux:novraux_secret@localhost:5432/novraux_db"
    OPENAI_API_KEY: str = ""
    GOOGLE_AI_KEY: str = ""
    AI_API_KEY: str = ""  # Groq
    AI_API_BASE_URL: str = "https://api.groq.com/openai/v1"
    ANTHROPIC_API_KEY: str = ""
    SHOPIFY_STORE_URL: str = ""
    SHOPIFY_ACCESS_TOKEN: str = ""
    PRINTFUL_API_KEY: str = ""

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
