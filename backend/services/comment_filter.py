import re
import unicodedata


# Regex patterns
URL_PATTERN = re.compile(
    r"(https?://[^\s]+|www\.[^\s]+|bit\.ly/[^\s]+|t\.co/[^\s]+|youtu\.be/[^\s]+)",
    re.IGNORECASE,
)

PROMO_KEYWORDS = re.compile(
    r"\b(subscribe|sub4sub|follow me|check out my|link in bio|promo|discount|"
    r"free|giveaway|win|click here|buy now|shop now|daftar|klik|gratis|"
    r"dapatkan|promosi|diskon|join now|bergabung)\b",
    re.IGNORECASE,
)

# Minimal char count (after stripping) to be considered a real comment
MIN_CHAR_COUNT = 3
MIN_WORD_COUNT = 2


def _is_emoji_only(text: str) -> bool:
    """Return True if text contains no meaningful alphabetic/numeric content."""
    cleaned = ""
    for char in text:
        cat = unicodedata.category(char)
        # Keep letters and numbers
        if cat.startswith("L") or cat.startswith("N"):
            cleaned += char
    return len(cleaned) < MIN_CHAR_COUNT


def _contains_url(text: str) -> bool:
    return bool(URL_PATTERN.search(text))


def _is_promotional(text: str) -> bool:
    return bool(PROMO_KEYWORDS.search(text))


def _is_too_short(text: str) -> bool:
    words = text.strip().split()
    return len(words) < MIN_WORD_COUNT


def filter_comments(comments: list[dict]) -> tuple[list[dict], int]:
    """
    Filter out spam, promotional, and emoji-only comments.

    Returns:
        - Filtered list of comments
        - Number of comments removed
    """
    seen_texts: set[str] = set()
    filtered = []
    removed_count = 0

    for comment in comments:
        text = comment.get("text", "").strip()

        if not text:
            removed_count += 1
            continue

        # 1. Deduplicate
        normalized = " ".join(text.lower().split())
        if normalized in seen_texts:
            removed_count += 1
            continue
        seen_texts.add(normalized)

        # 2. Too short
        if _is_too_short(text):
            removed_count += 1
            continue

        # 3. Emoji-only / no meaningful text
        if _is_emoji_only(text):
            removed_count += 1
            continue

        # 4. Contains URL (promo links)
        if _contains_url(text):
            removed_count += 1
            continue

        # 5. Promotional keywords
        if _is_promotional(text):
            removed_count += 1
            continue

        filtered.append(comment)

    return filtered, removed_count
