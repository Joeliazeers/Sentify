import { Clock, MessageSquare, Filter, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLanguage } from '../contexts/LanguageContext'

function StatItem({ icon: Icon, label, value, sub, color, colorBg }) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-2"
      style={{
        background: `color-mix(in srgb, ${color} 6%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            color,
          }}
        >
          <Icon size={14} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <div>
        <div
          className="font-display text-2xl font-extrabold tabular-nums leading-tight"
          style={{ color }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
        )}
      </div>
    </div>
  )
}

export default function StatsCard({ result }) {
  const { t } = useLanguage()
  const {
    total_comments_fetched,
    total_comments_filtered,
    total_comments_analyzed,
    analysis_time_seconds,
    cached,
  } = result

  const filterRate = total_comments_fetched > 0
    ? ((total_comments_filtered / total_comments_fetched) * 100).toFixed(1)
    : 0

  return (
    <Card id="stats-card" className="animate-fade-in-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">📈 {t('statsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={MessageSquare}
            color="hsl(238 84% 72%)"
            label={t('totalAnalyzed')}
            value={total_comments_analyzed.toLocaleString('id-ID')}
            sub={`${t('from')} ${total_comments_fetched.toLocaleString('id-ID')} ${t('comments')}`}
          />
          <StatItem
            icon={Filter}
            color="hsl(38 92% 55%)"
            label={t('filteredComments')}
            value={total_comments_filtered.toLocaleString('id-ID')}
            sub={`${filterRate}% ${t('spamPromo')}`}
          />
          <StatItem
            icon={Clock}
            color="hsl(158 78% 50%)"
            label={t('analysisTime')}
            value={`${analysis_time_seconds.toFixed(1)}s`}
            sub={cached ? `⚡ ${t('fromCache')}` : t('realTime')}
          />
          <StatItem
            icon={Zap}
            color="hsl(258 88% 76%)"
            label={t('speed')}
            value={(total_comments_analyzed / Math.max(analysis_time_seconds, 0.1)).toFixed(0)}
            sub={t('commentsPerSec')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
