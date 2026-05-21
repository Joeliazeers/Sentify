import os
import json
import redis
from diskcache import Cache
from config import settings
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

_redis_client = None
_disk_cache = None

if REDIS_URL:
    try:
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        # Test connection
        _redis_client.ping()
        logger.info("Connected to Redis cache.")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}. Falling back to diskcache.")
        _redis_client = None

if not _redis_client:
    _disk_cache = Cache("./local_cache")
    logger.info("Using diskcache for local caching.")


def get_cached(video_id: str):
    """Return cached analysis result or None."""
    if _redis_client:
        data = _redis_client.get(video_id)
        return json.loads(data) if data else None
    else:
        return _disk_cache.get(video_id)


def set_cached(video_id: str, result: dict):
    """Store analysis result in cache."""
    if _redis_client:
        _redis_client.setex(video_id, settings.CACHE_TTL_SECONDS, json.dumps(result))
    else:
        _disk_cache.set(video_id, result, expire=settings.CACHE_TTL_SECONDS)


def invalidate(video_id: str):
    """Remove a specific entry from cache."""
    if _redis_client:
        _redis_client.delete(video_id)
    else:
        _disk_cache.delete(video_id)


def cache_info() -> dict:
    """Return cache statistics."""
    if _redis_client:
        return {"type": "redis", "connected": True}
    else:
        return {"type": "diskcache", "size": len(_disk_cache)}
