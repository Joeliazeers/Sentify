import { useNavigate } from 'react-router-dom'
import { ThumbsUp, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import TranslatedText from './TranslatedText'
import { useLanguage } from '../contexts/LanguageContext'

const SENTIMENTS = [
  {
    key: 'positive',
    labelKey: 'positive',
    emoji: '😊',
    variant: 'positive',
    accentBorder: 'border-l-positive',
    accentColor: 'hsl(158 78% 50%)',
    gradFrom: 'from-positive',
    headerBorder: 'border-t-positive',
  },
  {
    key: 'negative',
    labelKey: 'negative',
    emoji: '😠',
    variant: 'negative',
    accentBorder: 'border-l-negative',
    accentColor: 'hsl(0 86% 67%)',
    gradFrom: 'from-negative',
    headerBorder: 'border-t-negative',
  },
]

function CommentCard({ comment, s, t }) {
  const pct = Math.round(comment.score * 100)
  return (
    <div
      className={`relative rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors duration-200 border-l-[3px] ${s.accentBorder}`}
    >
      {/* Quote mark */}
      <span
        className="absolute top-2.5 right-3 text-2xl leading-none font-serif select-none opacity-10"
        aria-hidden
      >
        "
      </span>

      <div className="flex items-center gap-2 mb-2">
        {/* Avatar with sentiment gradient */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{
            background: `linear-gradient(135deg, ${s.accentColor}cc, ${s.accentColor}55)`,
          }}
        >
          {comment.author?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{comment.author || t('anonymous')}</div>
          <Badge variant={s.variant} className="mt-0.5 text-[10px]">{pct}% {t('confidence')}</Badge>
        </div>
        {comment.like_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <ThumbsUp size={10} />
            {comment.like_count.toLocaleString('id-ID')}
          </div>
        )}
      </div>
      <TranslatedText
        text={comment.text}
        className="text-xs text-muted-foreground leading-relaxed line-clamp-4 block"
      />
    </div>
  )
}

export default function CommentHighlight({ topComments, videoId, sentimentCounts }) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="animate-fade-in-up delay-150" id="comment-highlight">
      <div className="flex flex-col gap-0.5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shrink-0">
            <span className="text-sm">💬</span>
          </div>
          <h3 className="font-display text-lg font-bold">{t('highlightTitle')}</h3>
        </div>
        <p className="text-sm text-muted-foreground pl-10">{t('highlightDesc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SENTIMENTS.map((s) => {
          const comments = topComments[s.key] || []
          if (!comments.length) return null
          const totalCount = sentimentCounts?.[s.key] ?? null

          return (
            <Card key={s.key} className={`border-t-2 ${s.headerBorder} flex flex-col`}>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-lg">{s.emoji}</span>
                  {t(s.labelKey)}
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    Top {comments.length}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-3 flex flex-col gap-2.5 flex-1">
                {comments.map((c, i) => (
                  <CommentCard key={i} comment={c} s={s} t={t} />
                ))}
              </CardContent>

              {totalCount > comments.length && (
                <CardFooter className="px-4 pt-0 pb-4">
                  <Button
                    id={`show-all-${s.key}-btn`}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => navigate(`/comments/${videoId}/${s.key}`)}
                  >
                    <ArrowRight size={13} />
                    {t('showAll')} {totalCount.toLocaleString()} {t(s.labelKey)} {t('comments2')}
                  </Button>
                </CardFooter>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
