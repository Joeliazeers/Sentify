import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '../contexts/LanguageContext'

const POS_COLOR = 'hsl(158 78% 50%)'
const NEG_COLOR = 'hsl(0 86% 67%)'

function buildBuckets(allComments) {
  const positive = (allComments?.positive ?? []).filter(c => c.position != null)
  const negative = (allComments?.negative ?? []).filter(c => c.position != null)

  const combined = [
    ...positive.map(c => ({ position: c.position, sent: 'positive' })),
    ...negative.map(c => ({ position: c.position, sent: 'negative' })),
  ].sort((a, b) => a.position - b.position)

  if (combined.length < 20) return null

  const bucketCount = Math.min(20, Math.floor(combined.length / 5))
  const bucketSize  = Math.ceil(combined.length / bucketCount)
  const buckets     = []

  for (let i = 0; i < combined.length; i += bucketSize) {
    const chunk    = combined.slice(i, i + bucketSize)
    const posCount = chunk.filter(c => c.sent === 'positive').length
    const posPct   = Math.round((posCount / chunk.length) * 100)
    buckets.push({
      batch:    buckets.length + 1,
      label:    `${i + 1}–${Math.min(i + bucketSize, combined.length)}`,
      positive: posPct,
      negative: 100 - posPct,
    })
  }

  return buckets
}

function CustomTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null
  const entry   = payload[0]?.payload
  const posPct  = entry?.positive ?? 0
  const negPct  = entry?.negative ?? 0
  return (
    <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-2xl text-xs space-y-1.5">
      <p className="font-semibold text-muted-foreground mb-1">
        {t('comments')} {entry?.label}
      </p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: POS_COLOR }} />
        <span>{t('positive')}: <strong>{posPct}%</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: NEG_COLOR }} />
        <span>{t('negative')}: <strong>{negPct}%</strong></span>
      </div>
    </div>
  )
}

export default function SentimentTimeline({ allComments }) {
  const { t } = useLanguage()
  const data   = useMemo(() => buildBuckets(allComments), [allComments])

  if (!data) return null

  return (
    <div className="animate-fade-in-up delay-100" id="sentiment-timeline">
      <div className="flex flex-col gap-0.5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shrink-0">
            <span className="text-sm">📈</span>
          </div>
          <h3 className="font-display text-lg font-bold">{t('timelineTitle')}</h3>
        </div>
        <p className="text-sm text-muted-foreground pl-10">{t('timelineDesc')}</p>
      </div>

      <Card>
        <CardContent className="pt-5 pb-4 px-4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="tlGradPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={POS_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={POS_COLOR} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="tlGradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={NEG_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={NEG_COLOR} stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.35)"
                vertical={false}
              />
              <XAxis
                dataKey="batch"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t('timelineBatch'),
                  position: 'insideBottom',
                  offset: 0,
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <ReferenceLine
                y={50}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Tooltip content={<CustomTooltip t={t} />} />

              {/* Stacked 100%: negative at bottom, positive on top */}
              <Area
                type="monotone"
                dataKey="negative"
                stackId="s"
                stroke={NEG_COLOR}
                strokeWidth={1.5}
                fill="url(#tlGradNeg)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="s"
                stroke={POS_COLOR}
                strokeWidth={1.5}
                fill="url(#tlGradPos)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: POS_COLOR }} />
              {t('positive')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: NEG_COLOR }} />
              {t('negative')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
