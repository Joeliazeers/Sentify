import re
import random
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from config import settings


def extract_video_id(url: str) -> str | None:
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"(?:youtu\.be\/)([0-9A-Za-z_-]{11})",
        r"(?:embed\/)([0-9A-Za-z_-]{11})",
        r"(?:shorts\/)([0-9A-Za-z_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_video_info(youtube, video_id: str) -> dict:
    """Fetch video metadata (title, channel, thumbnail)."""
    try:
        response = youtube.videos().list(
            part="snippet",
            id=video_id
        ).execute()

        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        snippet = response["items"][0]["snippet"]
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("maxres", {}).get("url")
            or thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or ""
        )

        return {
            "title": snippet.get("title", ""),
            "channel": snippet.get("channelTitle", ""),
            "thumbnail": thumbnail_url,
        }
    except HttpError as e:
        raise ValueError(f"YouTube API error: {e}")


def scrape_comments(video_id: str, max_comments: int, progress_callback=None) -> tuple[list[dict], dict]:
    """
    Scrape comments from a YouTube video.

    Always fetches up to MAX_COMMENTS (10,000).
    If the video has more comments than the limit, returns a random
    sample of max_comments so every comment below the limit is included.

    Returns:
        - List of comment dicts {author, text, like_count, published_at}
        - Video metadata dict
    """
    if not settings.YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not configured")

    youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)

    # Get video metadata
    video_info = get_video_info(youtube, video_id)

    limit = min(max_comments, settings.MAX_COMMENTS)

    comments = []
    next_page_token = None
    fetched = 0

    try:
        while fetched < limit:
            batch_size = min(100, limit - fetched)

            request_params = {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": batch_size,
                "textFormat": "plainText",
                "order": "relevance",
            }
            if next_page_token:
                request_params["pageToken"] = next_page_token

            response = youtube.commentThreads().list(**request_params).execute()

            for item in response.get("items", []):
                top_comment = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "author": top_comment.get("authorDisplayName", ""),
                    "text": top_comment.get("textDisplay", ""),
                    "like_count": top_comment.get("likeCount", 0),
                    "published_at": top_comment.get("publishedAt", ""),
                })

            fetched += len(response.get("items", []))

            if progress_callback:
                progress_callback(fetched, limit)

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

    except HttpError as e:
        if e.resp.status == 403:
            raise ValueError(
                "Komentar dinonaktifkan untuk video ini atau API quota habis."
            )
        raise ValueError(f"YouTube API error: {e}")

    # If we fetched more than the limit (shouldn't happen due to loop cap,
    # but as safety net), randomly sample down to limit
    if len(comments) > limit:
        comments = random.sample(comments, limit)

    return comments, video_info
