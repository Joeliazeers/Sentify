import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCw, BarChart2, MessageSquare, CloudSun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SentimentChart from '../components/SentimentChart'
import StatsCard from '../components/StatsCard'
import CommentHighlight from '../components/CommentHighlight'
import WordCloudPanel from '../components/WordCloudPanel'
import SentimentTimeline from '../components/SentimentTimeline'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../contexts/LanguageContext'

function SectionHeader({ icon: Icon, title, sub, color = 'text-primary' }) {
  return (
    <div className="flex flex-col gap-0.5 mb-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 ${color} shrink-0`}>
          <Icon size={15} />
        </div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
      </div>
      {sub && <p className="text-sm text-muted-foreground pl-10">{sub}</p>}
    </div>
  )
}

function GlowDivider() {
  return <div className="divider-glow my-8" />
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const result = state?.result

  if (!result) {
    navigate('/')
    return null
  }

  const ytUrl = `https://www.youtube.com/watch?v=${result.video_id}`
  const dist = result.sentiment_distribution
  const dominant = dist.positive.percentage >= dist.negative.percentage ? 'positive' : 'negative'
  const dominantPct = Math.round(Math.max(dist.positive.percentage, dist.negative.percentage))

  const hasTimeline = useMemo(() => {
    const pos = result.all_comments?.positive ?? []
    const neg = result.all_comments?.negative ?? []
    return [...pos, ...neg].some(c => c.position != null)
  }, [result.all_comments])

  return (
    <div className="min-h-screen py-6 pb-20 animate-fade-in">
      <div className="container max-w-5xl mx-auto px-6">

        {/* ── Topbar ── */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            id="back-btn"
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5"
          >
            <ArrowLeft size={14} />
            {t('analyzeOther')}
          </Button>
          {result.cached && (
            <Badge variant="positive">⚡ {t('fromCache')}</Badge>
          )}
          <div className="ml-auto">
            <LanguageToggle showOriginalControl />
          </div>
        </div>

        {/* ── Video Info ── */}
        <div id="video-info" className="flex gap-5 rounded-2xl border border-border bg-card p-5 mb-6 animate-fade-in-up overflow-hidden relative">
          {/* Subtle left-side glow matching dominant sentiment */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${dominant === 'positive' ? 'bg-positive' : 'bg-negative'}`} />

          {result.video_thumbnail && (
            <img
              src={result.video_thumbnail}
              alt={result.video_title}
              className="w-40 h-[90px] object-cover rounded-xl border border-border shrink-0 shadow-md"
            />
          )}
          <div className="flex flex-col justify-center gap-1.5 min-w-0 pl-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              {result.channel_name}
            </span>
            <h2 className="font-display text-lg font-bold leading-snug line-clamp-2">
              {result.video_title}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 w-fit text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink size={12} />
                {t('openYoutube')}
              </a>
              {/* Dominant sentiment pill */}
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                dominant === 'positive'
                  ? 'border-positive/25 bg-positive/10 text-positive'
                  : 'border-negative/25 bg-negative/10 text-negative'
              }`}>
                {dominant === 'positive' ? '😊' : '😠'} {dominantPct}% {t(dominant)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Chart + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 mb-6 animate-fade-in-up">
          <SentimentChart distribution={result.sentiment_distribution} />
          <StatsCard result={result} />
        </div>

        <GlowDivider />

        {/* ── Comment Highlights ── */}
        <CommentHighlight
          topComments={result.top_comments}
          videoId={result.video_id}
          sentimentCounts={{
            positive: dist.positive.count,
            neutral:  dist.neutral.count,
            negative: dist.negative.count,
          }}
        />

        <GlowDivider />

        {/* ── Sentiment Timeline (only for fresh analyses with position data) ── */}
        {hasTimeline && (
          <>
            <SentimentTimeline allComments={result.all_comments} />
            <GlowDivider />
          </>
        )}

        {/* ── Word Cloud ── */}
        <WordCloudPanel wordFrequencies={result.word_frequencies} />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          <p>Sentify • {t('finishedIn')} {result.analysis_time_seconds}s</p>
          <Button
            id="reanalyze-btn"
            variant="soft"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5"
          >
            <RefreshCw size={13} />
            {t('reanalyze')}
          </Button>
        </div>
      </div>
    </div>
  )
}
