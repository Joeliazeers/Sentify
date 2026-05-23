# Sentify — YouTube Sentiment Analysis

Analisis sentimen komentar YouTube menggunakan AI multilingual (XLM-RoBERTa).

## 🚀 Quick Start (Development)

### 1. Setup Environment

```bash
# Copy env file dan isi API Key
cp .env.example .env
# Edit .env → isi YOUTUBE_API_KEY
```

### 2. Jalankan Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
# Buka http://localhost:5173
```

---

## 🧠 Fine-tuning Model (Penting!)

Lihat **[model/README_training.md](model/README_training.md)** untuk panduan lengkap.

**Cara cepat (Google Colab — Gratis):**
1. Upload `model/train.py` ke Google Colab
2. Aktifkan GPU: Runtime → Change runtime type → T4 GPU
3. Install deps: `!pip install transformers datasets accelerate scikit-learn -q`
4. Jalankan: `!python train.py --output_dir ./fine_tuned_model --epochs 3`
5. Download hasil dan extract ke `backend/fine_tuned_model/`

> Tanpa fine-tuned model, backend otomatis pakai model pre-trained `cardiffnlp/twitter-xlm-roberta-base-sentiment`

---

## 🐳 Deploy dengan Docker

```bash
# Pastikan fine_tuned_model/ sudah ada di backend/
# Pastikan .env sudah diisi

docker compose up --build -d

# Frontend: http://localhost:80
# Backend API: http://localhost:8000
```

---

## 📁 Struktur Project

```
YoutubeSentimentAnalysis/
├── backend/           # FastAPI API server
│   ├── main.py        # Entry point + routes
│   ├── services/      # Scraper, filter, model, cache
│   ├── fine_tuned_model/  # ← Taruh model di sini setelah training
│   └── Dockerfile
├── frontend/          # React + Vite UI
│   ├── src/
│   │   ├── pages/     # Home, Results
│   │   └── components/# Chart, WordCloud, Stats, dll.
│   └── Dockerfile
├── model/             # Fine-tuning pipeline
│   ├── train.py       # Training script
│   ├── evaluate.py    # Evaluasi model
│   └── README_training.md
├── docker-compose.yml
└── .env.example
```

---

## 🔑 YouTube API Key

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru
3. Enable **YouTube Data API v3**
4. Buat API Key di Credentials
5. Masukkan ke `.env`: `YOUTUBE_API_KEY=your_key`

---
