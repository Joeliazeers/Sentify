from pydantic import BaseModel, HttpUrl
from typing import Optional
from enum import Enum


class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class AnalyzeRequest(BaseModel):
    url: str
    max_comments: Optional[int] = 2000

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "max_comments": 500,
            }
        }


class SentimentCount(BaseModel):
    count: int
    percentage: float


class SentimentDistribution(BaseModel):
    positive: SentimentCount
    neutral: SentimentCount
    negative: SentimentCount


class CommentItem(BaseModel):
    text: str
    author: str
    label: SentimentLabel
    score: float
    like_count: int
    position: Optional[int] = None


class WordFrequencyItem(BaseModel):
    word: str
    count: int


class WordFrequencies(BaseModel):
    positive: list[WordFrequencyItem]
    negative: list[WordFrequencyItem]


class TopComments(BaseModel):
    positive: list[CommentItem]
    neutral: list[CommentItem]
    negative: list[CommentItem]


class AllComments(BaseModel):
    positive: list[CommentItem]
    neutral: list[CommentItem]
    negative: list[CommentItem]


class AnalysisResult(BaseModel):
    video_id: str
    video_title: str
    video_thumbnail: str
    channel_name: str
    total_comments_fetched: int
    total_comments_filtered: int
    total_comments_analyzed: int
    analysis_time_seconds: float
    sentiment_distribution: SentimentDistribution
    top_comments: TopComments
    all_comments: AllComments
    word_frequencies: WordFrequencies
    cached: bool


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: int = 0
    message: str = ""
    result: Optional[AnalysisResult] = None
    error: Optional[str] = None


class PaginatedCommentsResponse(BaseModel):
    video_id: str
    video_title: str
    video_thumbnail: str
    channel_name: str
    sentiment: str
    total: int
    page: int
    per_page: int
    total_pages: int
    comments: list[CommentItem]
