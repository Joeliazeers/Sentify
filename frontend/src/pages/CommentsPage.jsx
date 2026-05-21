import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ThumbsUp, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, AlertCircle, Search, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TranslatedText from '@/components/TranslatedText'
import { getComments } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useLanguage } from '../contexts/LanguageContext'

const PER_PAGE = 20

// ─── Single comment card ──────────────────────────────────────────────────────
function CommentCard({ comment, cfg, index, page, t }) {
  const pct = Math.round(comment.score * 100)
  const globalIndex = (page - 1) * PER_PAGE + index + 1
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/40 transition-colors duration-200">
      {/* Rank number */}
      <div className="text-xs text-muted-foreground/40 font-mono w-6 pt-1 shrink-0 text-right select-none">
        {globalIndex}
      </div>

      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br',
        cfg.gradFrom, 'to-primary/50',
      )}>
        {comment.author?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-semibold truncate max-w-[200px]">
            {comment.author || t('anonymous')}
          </span>
          <Badge variant={cfg.badge} className="text-[10px] shrink-0">{pct}% {t('confidence')}</Badge>
          {comment.like_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto shrink-0">
              <ThumbsUp size={10} />
              {comment.like_count.toLocaleString()}
            </span>
          )}
        </div>
        <TranslatedText text={comment.text} className="text-sm text-muted-foreground leading-relaxed block" />
      </div>
    </div>
  )
}

// ─── Pagination controls ──────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange, isLoading, t }) {
  const range = useMemo(() => {
    const delta = 2
    const r = []
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      r.push(i)
    }
    return r
  }, [page, totalPages])

  if (totalPages <= 1) return null

  const showLeftDots  = range[0] > 2
  const showRightDots = range[range.length - 1] < totalPages - 1
  const btnCls = 'h-8 w-8 p-0 text-xs'

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap mt-8">
      <Button id="page-first" variant="outline" size="icon" className={btnCls}
        onClick={() => onPageChange(1)} disabled={page === 1 || isLoading} aria-label={t('pageFirst')}>
        <ChevronsLeft size={14} />
      </Button>
      <Button id="page-prev" variant="outline" size="icon" className={btnCls}
        onClick={() => onPageChange(page - 1)} disabled={page === 1 || isLoading} aria-label={t('prev')}>
        <ChevronLeft size={14} />
      </Button>

      <Button id="page-btn-1" variant={page === 1 ? 'default' : 'outline'} size="sm" className={btnCls}
        onClick={() => onPageChange(1)} disabled={isLoading}>1</Button>

      {showLeftDots && <span className="text-muted-foreground text-xs px-0.5 select-none">…</span>}

      {range.map(n => (
        <Button key={n} id={`page-btn-${n}`} variant={page === n ? 'default' : 'outline'} size="sm"
          className={btnCls} onClick={() => onPageChange(n)} disabled={isLoading}>{n}</Button>
      ))}

      {showRightDots && <span className="text-muted-foreground text-xs px-0.5 select-none">…</span>}

      {totalPages > 1 && (
        <Button id={`page-btn-${totalPages}`} variant={page === totalPages ? 'default' : 'outline'}
          size="sm" className={btnCls} onClick={() => onPageChange(totalPages)} disabled={isLoading}>
          {totalPages}
        </Button>
      )}

      <Button id="page-next" variant="outline" size="icon" className={btnCls}
        onClick={() => onPageChange(page + 1)} disabled={page === totalPages || isLoading} aria-label={t('next')}>
        <ChevronRight size={14} />
      </Button>
      <Button id="page-last" variant="outline" size="icon" className={btnCls}
        onClick={() => onPageChange(totalPages)} disabled={page === totalPages || isLoading} aria-label={t('pageLast')}>
        <ChevronsRight size={14} />
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommentsPage() {
  const { videoId, sentiment } = useParams()
  const navigate  = useNavigate()
  const { t, lang } = useLanguage()

  // Sentiment config using translation keys
  const SENTIMENT_CONFIG = {
    positive: {
      labelKey: 'positive',
      emoji:    '😊',
      badge:    'positive',
      border:   'border-t-positive',
      color:    'text-positive',
      dotBg:    'bg-positive',
      gradFrom: 'from-positive',
    },
    negative: {
      labelKey: 'negative',
      emoji:    '😠',
      badge:    'negative',
      border:   'border-t-negative',
      color:    'text-negative',
      dotBg:    'bg-negative',
      gradFrom: 'from-negative',
    },
  }

  const cfg = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.positive
  const sentimentLabel = t(cfg.labelKey)

  const [page, setPage]           = useState(1)
  const [sortBy, setSortBy]       = useState('confidence')
  const [data, setData]           = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const searchTimerRef            = useRef(null)

  const fetchPage = useCallback(async (p, sort = sortBy, q = '') => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getComments(videoId, sentiment, sort, p, PER_PAGE, q)
      setData(res)
      setPage(p)
      if (sort !== sortBy) setSortBy(sort)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err?.response?.data?.detail ?? t('loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [videoId, sentiment, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPage(1, 'confidence') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value) => {
    setSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => fetchPage(1, sortBy, value), 400)
  }

  return (
    <div className="min-h-screen py-6 pb-16 animate-fade-in">
      <div className="container max-w-3xl mx-auto px-6">

        {/* ── Topbar ── */}
        <div className="flex items-center gap-3 mb-6">
          <Button id="back-to-results-btn" variant="outline" size="sm"
            onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft size={14} />
            {t('backToResults')}
          </Button>

          <div className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border',
            cfg.color,
            sentiment === 'positive' && 'border-positive/25 bg-positive/10',
            sentiment === 'negative' && 'border-negative/25 bg-negative/10',
          )}>
            <span>{cfg.emoji}</span>
            {sentimentLabel} {t('comments2')}
          </div>
        </div>

        {/* ── Video info ── */}
        {data && (
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 mb-6 animate-fade-in-up">
            {data.video_thumbnail && (
              <img src={data.video_thumbnail} alt={data.video_title}
                className="w-28 h-16 object-cover rounded-lg border border-border shrink-0" />
            )}
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                {data.channel_name}
              </span>
              <h2 className="font-display text-base font-bold leading-snug line-clamp-2">
                {data.video_title}
              </h2>
            </div>
          </div>
        )}

        {/* ── Page heading ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display text-xl font-bold">
              {cfg.emoji} {t('allComments')} {sentimentLabel}
            </h1>
            {data && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {data.total.toLocaleString()} {t('comments')}
                {data.total_pages > 1 && ` • ${t('page')} ${page} ${t('of')} ${data.total_pages}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{t('sortBy')}:</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={sortBy}
              onChange={(e) => fetchPage(1, e.target.value, search)}
              disabled={isLoading}
            >
              <option value="confidence">{t('sortConfidence')}</option>
              <option value="likes">{t('sortLikes')}</option>
            </select>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            disabled={isLoading && !data}
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('clearSearch')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {search && data && (
          <p className="text-xs text-muted-foreground mb-3">
            {data.total.toLocaleString()} {t('searchResultsFor')} &ldquo;{search}&rdquo;
          </p>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-negative/20 bg-negative/8 px-4 py-3 text-sm text-negative mb-6">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {isLoading && !data && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl skeleton" />
            ))}
          </div>
        )}

        {/* ── Comment list ── */}
        {data && (
          <>
            <div className={cn(
              'flex flex-col gap-3 transition-opacity duration-200',
              isLoading && 'opacity-50 pointer-events-none',
            )}>
              {data.comments.length === 0 ? (
                <p className="text-center py-16 text-muted-foreground text-sm">
                  {search ? t('noSearchResults') : t('noComments')}
                </p>
              ) : (
                data.comments.map((c, i) => (
                  <CommentCard key={`${page}-${i}`} comment={c} cfg={cfg} index={i} page={page} t={t} />
                ))
              )}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" />
                {t('loadingPage')} {page}…
              </div>
            )}

            <Pagination
              page={page}
              totalPages={data.total_pages}
              onPageChange={(p) => fetchPage(p, sortBy, search)}
              isLoading={isLoading}
              t={t}
            />

            {data.total_pages > 1 && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                {t('showing')}{' '}
                {((page - 1) * PER_PAGE + 1).toLocaleString()}–
                {Math.min(page * PER_PAGE, data.total).toLocaleString()}{' '}
                {t('outOf')} {data.total.toLocaleString()} {t('comments')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
