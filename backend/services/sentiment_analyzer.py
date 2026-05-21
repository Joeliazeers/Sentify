import os
import re
import logging
from pathlib import Path
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
from config import settings

logger = logging.getLogger(__name__)

# Canonical label map — handles various model output label names
LABEL_MAP = {
    # cardiffnlp twitter-xlm-roberta labels
    "positive": "positive",
    "negative": "negative",
    "neutral": "neutral",
    # numeric labels (0=neg, 1=neu, 2=pos) used in some fine-tuned variants
    "label_0": "negative",
    "label_1": "neutral",
    "label_2": "positive",
    "0": "negative",
    "1": "neutral",
    "2": "positive",
    # LABEL_X style
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive",
}


class SentimentAnalyzer:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._load_model()

    def _load_model(self):
        """Load fine-tuned model if exists, else fallback to pre-trained."""
        model_path = settings.MODEL_PATH
        device = 0 if torch.cuda.is_available() else -1  # GPU if available

        if Path(model_path).exists() and any(Path(model_path).iterdir()):
            logger.info(f"Loading fine-tuned model from local path: {model_path}")
            model_name = model_path
        elif not model_path.startswith(".") and not Path(model_path).is_absolute():
            # Treat as HF Hub model ID (e.g. "jeelzr/sentify-model")
            logger.info(f"Loading fine-tuned model from HF Hub: {model_path}")
            model_name = model_path
        else:
            logger.warning(
                f"Fine-tuned model not found at '{model_path}'. "
                f"Using fallback: {settings.FALLBACK_MODEL}"
            )
            model_name = settings.FALLBACK_MODEL

        self.classifier = pipeline(
            "text-classification",
            model=model_name,
            tokenizer=model_name,
            device=device,
            truncation=True,
            max_length=128,
        )
        logger.info("Sentiment model loaded successfully.")

    def _normalize_label(self, raw_label: str) -> str:
        return LABEL_MAP.get(raw_label, LABEL_MAP.get(raw_label.lower(), "neutral"))

    def _post_process(self, text: str, raw_label: str, score: float) -> tuple[str, float]:
        label = self._normalize_label(raw_label)
        text_lower = text.lower()
        
        # 1. Fix false-positives (Sarcastic criticism disguised with positive words)
        if label == "positive":
            negative_cues = [
                "gak tertarik", "tidak tertarik", "harapan hilang", "mending android", 
                "mending brand sebelah", "buang duit", "nyesel beli", "overprice", 
                "kemahalan", "gimmick", "gimik", "kurang worth it", "gak worth it"
            ]
            if any(cue in text_lower for cue in negative_cues):
                return "negative", 0.8500

        # 2. Fix false-negatives (Heuristic rules for humor/sarcasm/OOT/Personal)
        if label == "negative":
            # Cues that heavily indicate a joke, meme, or lighthearted context rather than genuine negative sentiment
            humor_cues = ["haha", "hihi", "hehe", "wkwk", "xixi", "jaja", "lol", "lmao", "/s", "lha", "njir", "anjir", "awok", "kocak", "ngakak", "lucu", "malah", "bjir", "🗿"]
            emoji_cues = ["😂", "🤣", "💀", "😭", "😆", "😅", "🤪", "🤡", "🤭"]
            oot_ambiguous_cues = ["absen", "hadir", "nonton", "mampir", "menit", "detik", "salam", "dari", "nyimak", "coba review", "bang coba", "bahas dong", "request"]
            personal_cues = ["pengen", "pengin", "belum kesampaian", "belom kesampaian", "ngawang", "mimpi", "nyesel ga ambil", "nyesel ga beli"]
            
            has_humor = any(cue in text_lower for cue in humor_cues)
            has_emoji = any(cue in text_lower for cue in emoji_cues)
            has_oot = any(cue in text_lower for cue in oot_ambiguous_cues)
            has_personal = any(cue in text_lower for cue in personal_cues)
            has_timestamp = bool(re.search(r'\b\d{1,2}:\d{2}\b', text_lower))
            
            # Jika mengandung humor, emoji tertawa, OOT, personal, timestamp, ATAU confidence model terlalu rendah
            if has_humor or has_emoji or has_oot or has_personal or has_timestamp or score < 0.75:
                # Downgrade false-negative ke netral
                return "neutral", 0.6500

        return label, round(score, 4)

    def predict_batch(self, texts: list[str], progress_callback=None) -> list[dict]:
        """
        Run batch inference on a list of texts.

        Returns list of {label, score} dicts.
        """
        results = []
        batch_size = settings.BATCH_SIZE
        total = len(texts)

        for i in range(0, total, batch_size):
            if progress_callback:
                progress_callback(i, total)
                
            batch = texts[i : i + batch_size]
            try:
                preds = self.classifier(batch, batch_size=batch_size)
                for text, pred in zip(batch, preds):
                    final_label, final_score = self._post_process(text, pred["label"], pred["score"])
                    results.append({
                        "label": final_label,
                        "score": final_score,
                    })
            except Exception as e:
                logger.error(f"Inference error on batch {i}: {e}")
                # Fallback: mark as neutral with low confidence
                for _ in batch:
                    results.append({"label": "neutral", "score": 0.5})

        return results


# Global singleton instance — loaded once on startup
analyzer = SentimentAnalyzer()
