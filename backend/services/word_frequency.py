import re
from collections import Counter

# ─── Indonesian stopwords ─────────────────────────────────────────────────────
ID_STOPWORDS = {
    "yang", "dan", "di", "ke", "dari", "dengan", "ini", "itu", "untuk", "ada",
    "adalah", "akan", "dalam", "juga", "lebih", "pada", "tidak", "bisa", "aku",
    "kamu", "saya", "dia", "kami", "kita", "mereka", "sudah", "belum",
    "ya", "yg", "ga", "gak", "nggak", "ngga", "si", "pun", "aja", "nih",
    "deh", "sih", "lah", "lo", "lu", "gue", "gw", "emang", "tapi",
    "kalau", "kalo", "sama", "kaya", "kayak", "banget", "bgt", "banyak",
    "sangat", "sekali", "punya", "harus", "mau", "udah", "udh", "atau",
    "karena", "karna", "jadi", "jd", "masih", "baru", "lagi",
    "terus", "saja", "se", "nya", "kan", "dong", "ayo", "gimana",
    "kenapa", "semua", "mana", "paling", "wah", "oh",
    "seperti", "sepert", "maka", "tetapi", "namun", "bahwa", "bahkan",
    "memang", "orang", "video", "channel", "yt", "nya", "buat", "juga",
    "aja", "tuh", "nih", "gitu", "gini", "yuk", "deh", "sih",
}

# ─── English stopwords ────────────────────────────────────────────────────────
EN_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "this", "that",
    "these", "those", "i", "me", "my", "we", "our", "you", "your", "he",
    "she", "it", "they", "them", "their", "what", "which", "who", "whom",
    "when", "where", "why", "how", "all", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "same",
    "so", "than", "too", "very", "just", "but", "and", "or", "as", "of",
    "at", "by", "for", "with", "about", "into", "through", "before",
    "after", "to", "from", "up", "down", "in", "out", "on", "off",
    "then", "once", "here", "there", "any", "if", "because", "while",
    "video", "channel", "youtube", "comment", "like", "also", "even",
    "still", "already", "now", "im", "its", "ive", "dont", "cant",
    "youre", "theyre", "thats", "doesnt", "didnt", "wasnt", "isnt",
    "really", "actually", "literally", "just", "so", "get", "got",
    "one", "two", "three", "go", "going", "know", "think", "see",
    "make", "made", "want", "need", "look", "come", "said", "say",
    "well", "yeah", "yes", "no", "oh", "ok", "okay",
}

ALL_STOPWORDS = ID_STOPWORDS | EN_STOPWORDS

TOKEN_PATTERN = re.compile(r"[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]{3,}")


def _tokenize(text: str) -> list[str]:
    """Extract meaningful word tokens, removing stopwords."""
    tokens = TOKEN_PATTERN.findall(text.lower())
    return [t for t in tokens if t not in ALL_STOPWORDS and len(t) >= 3]


def compute_word_frequencies(
    labeled_comments: list[dict],
    top_n: int = 100,
) -> dict:
    """
    Compute discriminative word frequencies for positive and negative comments.

    Uses a discriminativeness score: words that appear predominantly in one
    sentiment category rank higher than words that appear in both (like the
    video title/topic name). Formula:

        score = (sentiment_ratio² × sqrt(abs_count))

    where sentiment_ratio = how much a word skews to that sentiment (0.5 = neutral).
    Words that appear equally in positive and negative are suppressed.

    Args:
        labeled_comments: list of {text, label, score, ...}
        top_n: number of top words to return per sentiment

    Returns:
        {
            "positive": [{"word": ..., "count": ...}, ...],
            "negative": [{"word": ..., "count": ...}, ...]
        }
    """
    pos_counter: Counter = Counter()
    neg_counter: Counter = Counter()

    for item in labeled_comments:
        tokens = _tokenize(item.get("text", ""))
        if item.get("label") == "positive":
            pos_counter.update(tokens)
        elif item.get("label") == "negative":
            neg_counter.update(tokens)

    all_words = set(pos_counter.keys()) | set(neg_counter.keys())

    MIN_ABS_FREQ = 2   # must appear at least this many times to be included

    pos_scored: list[dict] = []
    neg_scored: list[dict] = []

    for word in all_words:
        p = pos_counter.get(word, 0)
        n = neg_counter.get(word, 0)
        total = p + n

        if total < MIN_ABS_FREQ:
            continue

        # Fraction of appearances in each sentiment
        pos_ratio = p / total   # 1.0 = only in positive
        neg_ratio = n / total   # 1.0 = only in negative

        # Discriminativeness score: ratio² penalises "neutral" words heavily.
        # e.g. "genshin" (50% pos / 50% neg) → ratio=0.5, ratio²=0.25
        #      "amazing" (90% pos / 10% neg)  → ratio=0.9, ratio²=0.81
        # Multiply by sqrt(count) so rare words don't dominate.
        if p >= MIN_ABS_FREQ:
            pos_score = (pos_ratio ** 2) * (p ** 0.5)
            pos_scored.append({"word": word, "count": p, "score": pos_score})

        if n >= MIN_ABS_FREQ:
            neg_score = (neg_ratio ** 2) * (n ** 0.5)
            neg_scored.append({"word": word, "count": n, "score": neg_score})

    pos_scored.sort(key=lambda x: -x["score"])
    neg_scored.sort(key=lambda x: -x["score"])

    return {
        "positive": [{"word": w["word"], "count": w["count"]} for w in pos_scored[:top_n]],
        "negative": [{"word": w["word"], "count": w["count"]} for w in neg_scored[:top_n]],
    }
