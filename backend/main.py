import time
import uuid
import logging
from contextlib import asynccontextmanager
from collections import defaultdict
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from schemas import (
    AnalyzeRequest,
    AnalysisResult,
    TaskResponse,
    TaskStatus,
    SentimentDistribution,
    SentimentCount,
    TopComments,
    AllComments,
    CommentItem,
    SentimentLabel,
    WordFrequencies,
    WordFrequencyItem,
    PaginatedCommentsResponse,
)
from services.youtube_scraper import extract_video_id, scrape_comments
from services.comment_filter import filter_comments
from services.sentiment_analyzer import analyzer
from services.word_frequency import compute_word_frequencies
from services import cache
from database import SessionLocal, DBAnalysisResult

logger = logging.getLogger(__name__)

# In-memory task store
tasks: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up model on startup
    logger.info("Warming up sentiment model...")
    try:
        analyzer.predict_batch(["test"])
        logger.info("Model ready.")
    except Exception as e:
        logger.error(f"Model warm-up failed: {e}")
    yield


app = FastAPI(
    title="YouTube Sentiment Analysis API",
    version="1.0.0",
    description="Analyze sentiment of YouTube comments using fine-tuned XLM-RoBERTa",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper ────────────────────────────────────────────────────────────────────

def _build_result(
    video_id: str,
    video_info: dict,
    labeled_comments: list[dict],
    total_fetched: int,
    total_filtered: int,
    elapsed: float,
    cached: bool,
) -> AnalysisResult:
    total_analyzed = len(labeled_comments)

    # Sentiment counts
    counts = defaultdict(int)
    for c in labeled_comments:
        counts[c["label"]] += 1

    def pct(n: int) -> float:
        return round(n / total_analyzed * 100, 1) if total_analyzed > 0 else 0.0

    distribution = SentimentDistribution(
        positive=SentimentCount(count=counts["positive"], percentage=pct(counts["positive"])),
        neutral=SentimentCount(count=counts["neutral"], percentage=pct(counts["neutral"])),
        negative=SentimentCount(count=counts["negative"], percentage=pct(counts["negative"])),
    )

    # Top comments per sentiment (highest confidence first)
    def top_for(label: str) -> list[CommentItem]:
        items = [c for c in labeled_comments if c["label"] == label]
        items.sort(key=lambda x: x["score"], reverse=True)
        return [
            CommentItem(
                text=c["text"],
                author=c["author"],
                label=SentimentLabel(c["label"]),
                score=c["score"],
                like_count=c.get("like_count", 0),
                position=c.get("position"),
            )
            for c in items[: settings.TOP_COMMENTS_PER_SENTIMENT]
        ]

    top_comments = TopComments(
        positive=top_for("positive"),
        neutral=top_for("neutral"),
        negative=top_for("negative"),
    )

    # Word frequencies
    wf_raw = compute_word_frequencies(labeled_comments, top_n=settings.TOP_WORDS_PER_SENTIMENT)
    word_frequencies = WordFrequencies(
        positive=[WordFrequencyItem(**w) for w in wf_raw["positive"]],
        negative=[WordFrequencyItem(**w) for w in wf_raw["negative"]],
    )

    # All comments (positive + negative), sorted by confidence score descending
    def all_for(label: str) -> list[CommentItem]:
        items = [c for c in labeled_comments if c["label"] == label]
        items.sort(key=lambda x: x["score"], reverse=True)
        return [
            CommentItem(
                text=c["text"],
                author=c["author"],
                label=SentimentLabel(c["label"]),
                score=c["score"],
                like_count=c.get("like_count", 0),
                position=c.get("position"),
            )
            for c in items
        ]

    all_comments = AllComments(
        positive=all_for("positive"),
        neutral=all_for("neutral"),
        negative=all_for("negative"),
    )

    return AnalysisResult(
        video_id=video_id,
        video_title=video_info.get("title", ""),
        video_thumbnail=video_info.get("thumbnail", ""),
        channel_name=video_info.get("channel", ""),
        total_comments_fetched=total_fetched,
        total_comments_filtered=total_filtered,
        total_comments_analyzed=total_analyzed,
        analysis_time_seconds=round(elapsed, 2),
        sentiment_distribution=distribution,
        top_comments=top_comments,
        all_comments=all_comments,
        word_frequencies=word_frequencies,
        cached=cached,
    )


def _run_analysis(task_id: str, video_id: str, video_url: str, body_max_comments: int = 500):
    """Background task: full analysis pipeline."""
    task = tasks[task_id]
    start = time.time()
    max_comments = min(body_max_comments, settings.MAX_COMMENTS)

    try:
        # Step 1: Scrape
        task.update({"status": TaskStatus.PROCESSING, "progress": 5, "message": "Mengambil komentar..."})

        raw_comments, video_info = scrape_comments(
            video_id=video_id,
            max_comments=max_comments,
            progress_callback=lambda fetched, total: tasks[task_id].update({
                "progress": int(5 + (fetched / max(total, 1)) * 30),
                "message": f"Mengambil komentar... ({fetched:,})",
            }),
        )
        total_fetched = len(raw_comments)
        task.update({"progress": 35, "message": f"Berhasil mengambil {total_fetched:,} komentar. Memfilter..."})

        # Step 2: Filter
        filtered_comments, removed_count = filter_comments(raw_comments)
        task.update({"progress": 45, "message": f"Filter selesai. Menganalisis sentimen..."})

        # Step 3: Inference
        texts = [c["text"] for c in filtered_comments]
        task.update({"progress": 50, "message": f"Menjalankan model AI pada {len(texts):,} komentar..."})

        def analysis_progress(processed: int, total: int):
            prog = int(50 + (processed / max(total, 1)) * 40)
            task.update({
                "progress": prog,
                "message": f"Menjalankan model AI ({processed:,}/{total:,})..."
            })

        predictions = analyzer.predict_batch(texts, progress_callback=analysis_progress)

        # Merge predictions into comment dicts, preserving fetch order via position index
        labeled_comments = []
        for i, (comment, pred) in enumerate(zip(filtered_comments, predictions)):
            labeled_comments.append({**comment, **pred, "position": i})

        task.update({"progress": 90, "message": "Menyusun hasil..."})

        elapsed = time.time() - start
        result = _build_result(
            video_id=video_id,
            video_info=video_info,
            labeled_comments=labeled_comments,
            total_fetched=total_fetched,
            total_filtered=removed_count,
            elapsed=elapsed,
            cached=False,
        )

        # Save to Database permanently
        try:
            db = SessionLocal()
            existing = db.query(DBAnalysisResult).filter(DBAnalysisResult.video_id == video_id).first()
            if existing:
                existing.result_data = result.model_dump()
            else:
                new_record = DBAnalysisResult(video_id=video_id, result_data=result.model_dump())
                db.add(new_record)
            db.commit()
            db.close()
            logger.info(f"Saved {video_id} to database.")
        except Exception as db_err:
            logger.error(f"Failed to save to DB: {db_err}")

        # Cache result
        cache.set_cached(video_id, result.model_dump())

        task.update({
            "status": TaskStatus.COMPLETED,
            "progress": 100,
            "message": f"Selesai! {len(labeled_comments):,} komentar dianalisis dalam {elapsed:.1f} detik.",
            "result": result.model_dump(),
        })

    except Exception as e:
        logger.exception(f"Analysis failed for task {task_id}: {e}")
        task.update({
            "status": TaskStatus.FAILED,
            "progress": 0,
            "message": "Analisis gagal.",
            "error": str(e),
        })


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "cache": cache.cache_info()}


@app.get("/api/comments/{video_id}", response_model=PaginatedCommentsResponse)
def get_paginated_comments(
    video_id: str,
    sentiment: str = Query(..., regex="^(positive|negative|neutral)$"),
    sort_by: str = Query("confidence", regex="^(confidence|likes)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
):
    """
    Return paginated comments for a video, filtered by sentiment.
    The video must have been analysed first (result lives in cache).
    """
    cached_result = cache.get_cached(video_id)
    if not cached_result:
        # Fallback to database
        try:
            db = SessionLocal()
            db_record = db.query(DBAnalysisResult).filter(DBAnalysisResult.video_id == video_id).first()
            if db_record and db_record.result_data:
                cached_result = db_record.result_data
                # Repopulate cache
                cache.set_cached(video_id, cached_result)
            db.close()
        except Exception as e:
            logger.error(f"DB Error fetching paginated comments: {e}")
            
    if not cached_result:
        raise HTTPException(
            status_code=404,
            detail="Hasil analisis tidak ditemukan. Silakan analisis ulang.",
        )

    all_comments_raw: list[dict] = cached_result.get("all_comments", {}).get(sentiment, [])

    # Keyword search filter
    if search and search.strip():
        q = search.strip().lower()
        all_comments_raw = [
            c for c in all_comments_raw
            if q in c.get("text", "").lower() or q in c.get("author", "").lower()
        ]

    # Sorting
    if sort_by == "likes":
        all_comments_raw = sorted(all_comments_raw, key=lambda x: x.get("like_count", 0), reverse=True)
    else:
        # Default: confidence (score)
        all_comments_raw = sorted(all_comments_raw, key=lambda x: x.get("score", 0), reverse=True)

    total = len(all_comments_raw)
    total_pages = max(1, (total + per_page - 1) // per_page)

    start = (page - 1) * per_page
    end   = start + per_page
    page_items = [
        CommentItem(**c) if isinstance(c, dict) else c
        for c in all_comments_raw[start:end]
    ]

    return PaginatedCommentsResponse(
        video_id=video_id,
        video_title=cached_result.get("video_title", ""),
        video_thumbnail=cached_result.get("video_thumbnail", ""),
        channel_name=cached_result.get("channel_name", ""),
        sentiment=sentiment,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        comments=page_items,
    )


@app.post("/api/analyze", response_model=TaskResponse, status_code=202)
def start_analysis(body: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Start a sentiment analysis job.
    Returns task_id immediately; poll /api/status/{task_id} for progress.
    """
    video_id = extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="URL YouTube tidak valid.")

    # Check cache first
    cached_result = cache.get_cached(video_id)
    if not cached_result:
        # Check database
        try:
            db = SessionLocal()
            db_record = db.query(DBAnalysisResult).filter(DBAnalysisResult.video_id == video_id).first()
            if db_record and db_record.result_data:
                cached_result = db_record.result_data
                cache.set_cached(video_id, cached_result)
            db.close()
        except Exception as e:
            logger.error(f"DB Error: {e}")

    if cached_result:
        task_id = str(uuid.uuid4())
        tasks[task_id] = {
            "status": TaskStatus.COMPLETED,
            "progress": 100,
            "message": "Hasil diambil dari cache.",
            "result": {**cached_result, "cached": True},
            "error": None,
        }
        return TaskResponse(
            task_id=task_id,
            status=TaskStatus.COMPLETED,
            progress=100,
            message="Hasil diambil dari cache.",
            result=AnalysisResult(**{**cached_result, "cached": True}),
        )

    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": TaskStatus.PENDING,
        "progress": 0,
        "message": "Memulai analisis...",
        "result": None,
        "error": None,
    }

    background_tasks.add_task(_run_analysis, task_id, video_id, body.url, body.max_comments or 2000)

    return TaskResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        progress=0,
        message="Memulai analisis...",
    )


@app.get("/api/status/{task_id}", response_model=TaskResponse)
def get_status(task_id: str):
    """Poll the status of an ongoing analysis task."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan.")

    result = None
    if task.get("result"):
        result = AnalysisResult(**task["result"])

    return TaskResponse(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        result=result,
        error=task.get("error"),
    )
