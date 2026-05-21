export const translations = {
  id: {
    // Home.jsx
    poweredBy: 'Powered by XLM-RoBERTa Fine-tuned',
    title1: 'Analisis Sentimen',
    title2: 'Komentar YouTube',
    subtitle: 'Masukkan link video YouTube dan biarkan AI menganalisis ribuan komentar dalam hitungan detik.',
    feat1Title: 'Donut Chart Interaktif',
    feat1Desc: 'Persentase sentimen dengan visualisasi dinamis',
    feat2Title: 'Highlight Komentar',
    feat2Desc: 'Top 5 komentar representatif per sentimen',
    feat3Title: 'Auto Translate',
    feat3Desc: 'Terjemahkan komentar ke Bahasa Indonesia / Inggris',
    feat4Title: 'Non-blocking UI',
    feat4Desc: 'Proses hingga 10.000 komentar tanpa freeze',
    footer: 'Sentify • Analisis Sentimen Multilingual (Indonesia & Inggris)',
    invalidUrl: 'URL YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=...',

    // SearchBar.jsx
    placeholderUrl: 'Tempel link YouTube di sini...',
    analyzing: 'Menganalisis...',
    analyze: 'Analisis',

    // Results.jsx
    analyzeOther: 'Analisis Video Lain',
    fromCache: 'Dari Cache',
    openYoutube: 'Buka di YouTube',
    finishedIn: 'Selesai dalam',
    reanalyze: 'Analisis Ulang',

    // SentimentChart.jsx
    distributionTitle: 'Distribusi Sentimen',
    positive: 'Positif',
    negative: 'Negatif',
    comments: 'komentar',

    // StatsCard.jsx
    statsTitle: 'Statistik Analisis',
    totalAnalyzed: 'Total Dianalisis',
    from: 'dari',
    filteredComments: 'Komentar Difilter',
    spamPromo: '(spam/promo/emoji)',
    analysisTime: 'Waktu Analisis',
    realTime: 'Waktu nyata',
    speed: 'Kecepatan',
    commentsPerSec: 'komentar/detik',

    // CommentHighlight.jsx
    highlightTitle: 'Komentar Representatif',
    highlightDesc: 'Komentar terpilih dengan confidence score tertinggi per kategori',
    confidence: 'konfiden',
    anonymous: 'Anonim',
    positiveComments: 'Komentar Positif',
    negativeComments: 'Komentar Negatif',
    showMore: 'Lihat Semua',
    showAll: 'Tampilkan Semua',
    comments2: 'Komentar',

    // CommentsPage.jsx
    allComments: 'Semua Komentar',
    allPositiveComments: 'Semua Komentar Positif',
    allNegativeComments: 'Semua Komentar Negatif',
    backToResults: 'Kembali ke Hasil',
    page: 'Halaman',
    of: 'dari',
    prev: 'Sebelumnya',
    next: 'Berikutnya',
    pageFirst: 'Halaman pertama',
    pageLast: 'Halaman terakhir',
    noComments: 'Tidak ada komentar.',
    sortBy: 'Urutkan',
    sortConfidence: 'Konfidensi (Tinggi ke Rendah)',
    sortLikes: 'Like (Terbanyak ke Sedikit)',
    loadError: 'Gagal memuat komentar. Pastikan analisis sudah selesai.',
    loadingPage: 'Memuat halaman',
    showing: 'Menampilkan',
    outOf: 'dari',

    // WordCloudPanel.jsx
    wordCloudTitle: 'Awan Kata (Word Cloud)',
    wordCloudDesc: 'Kata yang paling sering muncul di komentar positif dan negatif',
    uniqueWords: 'kata unik',
    notEnoughData: 'Tidak cukup data kata',

    // LanguageToggle.jsx
    hideOriginal: 'Sembunyikan Asli',
    showOriginal: 'Lihat Asli',
    
    // TranslatedText.jsx
    translating: 'Menerjemahkan...',
    translate: 'Terjemahkan',

    // LoadingOverlay.jsx
    analyzingComments: 'Menganalisis Komentar...',
    step1: 'Mengambil komentar dari YouTube',
    step2: 'Memfilter spam & komentar tidak relevan',
    step3: 'Menjalankan model AI (XLM-RoBERTa)',
    step4: 'Menyusun hasil analisis',

    // SentimentTimeline.jsx
    timelineTitle: 'Timeline Sentimen',
    timelineDesc: 'Rasio sentimen sepanjang urutan komentar yang diambil',
    timelineBatch: 'Kelompok',
    timelineNoData: 'Data timeline tidak tersedia untuk hasil dari cache lama.',

    // CommentsPage.jsx (search)
    searchPlaceholder: 'Cari komentar atau nama pengguna...',
    searchResultsFor: 'hasil untuk',
    clearSearch: 'Hapus',
    noSearchResults: 'Tidak ada komentar yang cocok.',
  },
  en: {
    // Home.jsx
    poweredBy: 'Powered by XLM-RoBERTa Fine-tuned',
    title1: 'Sentiment Analysis',
    title2: 'YouTube Comments',
    subtitle: 'Paste a YouTube video link and let AI analyze thousands of comments in seconds.',
    feat1Title: 'Interactive Donut Chart',
    feat1Desc: 'Sentiment percentages with dynamic visualization',
    feat2Title: 'Comment Highlights',
    feat2Desc: 'Top 5 representative comments per sentiment',
    feat3Title: 'Auto Translate',
    feat3Desc: 'Translate comments to Indonesian / English',
    feat4Title: 'Non-blocking UI',
    feat4Desc: 'Process up to 10,000 comments without freezing',
    footer: 'Sentify • Multilingual Sentiment Analysis (Indonesian & English)',
    invalidUrl: 'Invalid YouTube URL. Example: https://www.youtube.com/watch?v=...',

    // SearchBar.jsx
    placeholderUrl: 'Paste YouTube link here...',
    analyzing: 'Analyzing...',
    analyze: 'Analyze',

    // Results.jsx
    analyzeOther: 'Analyze Another Video',
    fromCache: 'From Cache',
    openYoutube: 'Open in YouTube',
    finishedIn: 'Finished in',
    reanalyze: 'Reanalyze',

    // SentimentChart.jsx
    distributionTitle: 'Sentiment Distribution',
    positive: 'Positive',
    negative: 'Negative',
    comments: 'comments',

    // StatsCard.jsx
    statsTitle: 'Analysis Statistics',
    totalAnalyzed: 'Total Analyzed',
    from: 'out of',
    filteredComments: 'Filtered Comments',
    spamPromo: '(spam/promo/emoji)',
    analysisTime: 'Analysis Time',
    realTime: 'Real-time',
    speed: 'Speed',
    commentsPerSec: 'comments/sec',

    // CommentHighlight.jsx
    highlightTitle: 'Representative Comments',
    highlightDesc: 'Selected comments with the highest confidence score per category',
    confidence: 'confident',
    anonymous: 'Anonymous',
    positiveComments: 'Positive Comments',
    negativeComments: 'Negative Comments',
    showMore: 'Show All',
    showAll: 'Show All',
    comments2: 'Comments',

    // CommentsPage.jsx
    allComments: 'All',
    allPositiveComments: 'All Positive Comments',
    allNegativeComments: 'All Negative Comments',
    backToResults: 'Back to Results',
    page: 'Page',
    of: 'of',
    prev: 'Previous',
    next: 'Next',
    pageFirst: 'First page',
    pageLast: 'Last page',
    noComments: 'No comments found.',
    sortBy: 'Sort by',
    sortConfidence: 'Confidence (High to Low)',
    sortLikes: 'Likes (Most to Least)',
    loadError: 'Failed to load comments. Make sure the analysis is complete.',
    loadingPage: 'Loading page',
    showing: 'Showing',
    outOf: 'of',

    // WordCloudPanel.jsx
    wordCloudTitle: 'Word Cloud',
    wordCloudDesc: 'Most frequently used words in positive and negative comments',
    uniqueWords: 'unique words',
    notEnoughData: 'Not enough word data',

    // LanguageToggle.jsx
    hideOriginal: 'Hide Original',
    showOriginal: 'Show Original',
    
    // TranslatedText.jsx
    translating: 'Translating...',
    translate: 'Translate',

    // LoadingOverlay.jsx
    analyzingComments: 'Analyzing Comments...',
    step1: 'Fetching comments from YouTube',
    step2: 'Filtering spam & irrelevant comments',
    step3: 'Running AI model (XLM-RoBERTa)',
    step4: 'Compiling analysis results',

    // SentimentTimeline.jsx
    timelineTitle: 'Sentiment Timeline',
    timelineDesc: 'Sentiment ratio across the fetched comment order',
    timelineBatch: 'Batch',
    timelineNoData: 'Timeline data is not available for older cached results.',

    // CommentsPage.jsx (search)
    searchPlaceholder: 'Search comments or usernames...',
    searchResultsFor: 'results for',
    clearSearch: 'Clear',
    noSearchResults: 'No comments match your search.',
  }
}
