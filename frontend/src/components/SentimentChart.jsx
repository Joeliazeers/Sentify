import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLanguage } from '../contexts/LanguageContext'

const COLORS = {
  positive: 'hsl(158 78% 50%)',
  negative: 'hsl(0 86% 67%)',
}

function CustomTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-2xl">
      <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[d.key] }} />
      <div>
        <div className="text-sm font-semibold">{t(d.key)}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {d.count.toLocaleString('id-ID')} {t('comments')} ({d.percentage.toFixed(1)}%)
        </div>
      </div>
    </div>
  )
}

const EMOJI = { positive: '😊', negative: '😠' }

export default function SentimentChart({ distribution }) {
  const { t } = useLanguage()

  const data = [
    { key: 'positive', ...distribution.positive },
    { key: 'negative', ...distribution.negative },
  ].filter(d => d.count > 0)

  const dominant = data.reduce((a, b) => a.percentage > b.percentage ? a : b, data[0])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          📊 {t('distributionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Donut chart */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={62} outerRadius={100}
                paddingAngle={3} dataKey="percentage"
                labelLine={false}
                animationBegin={0} animationDuration={900}
              >
                {data.map(entry => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip t={t} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-2xl leading-none">{EMOJI[dominant?.key]}</span>
            <span
              className="font-display text-3xl font-extrabold tabular-nums leading-none"
              style={{ color: COLORS[dominant?.key] }}
            >
              {dominant?.percentage.toFixed(0)}%
            </span>
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
              {t(dominant?.key)}
            </span>
          </div>
        </div>

        {/* Progress-bar legend */}
        <div className="flex flex-col gap-3 mt-3">
          {data.map(d => (
            <div key={d.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[d.key] }} />
                  <span className="font-medium">{t(d.key)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground tabular-nums">
                  <span>{d.count.toLocaleString('id-ID')}</span>
                  <span className="font-semibold" style={{ color: COLORS[d.key] }}>
                    {d.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Bar */}
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.percentage}%`,
                    background: COLORS[d.key],
                    boxShadow: `0 0 8px ${COLORS[d.key]}55`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
