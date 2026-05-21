import os
from sqlalchemy import create_engine, Column, String, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Example for postgres: "postgresql://user:password@localhost/dbname"
    engine = create_engine(DATABASE_URL)
else:
    # Fallback to SQLite so the app doesn't crash locally
    engine = create_engine("sqlite:///./sentify_db.sqlite3", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBAnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    video_id = Column(String, primary_key=True, index=True)
    result_data = Column(JSON)

Base.metadata.create_all(bind=engine)
