import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    MAX_COMMENTS: int = int(os.getenv("MAX_COMMENTS", "10000"))
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
    CACHE_MAX_SIZE: int = int(os.getenv("CACHE_MAX_SIZE", "100"))
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./fine_tuned_model")
    FALLBACK_MODEL: str = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "64"))
    TOP_COMMENTS_PER_SENTIMENT: int = 5
    TOP_WORDS_PER_SENTIMENT: int = 100
    CORS_ORIGINS: list = [
        o for o in [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:80",
            os.getenv("FRONTEND_URL", ""),
        ]
        if o  # filter out empty strings from unset env vars
    ]


settings = Settings()
