import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLanguage } from '../contexts/LanguageContext'

const COLORS = {
  positive: {
    word: 'hsl(158 78% 50%)',
    dot: 'bg-positive',
    border: 'border-t-positive',
    glow: '0 0 12px hsl(158 78% 50% / 0.18)',
    gradient: 'from-positive/8 to-transparent',
  },
  negative: {
    word: 'hsl(0 86% 67%)',
    dot: 'bg-negative',
    border: 'border-t-negative',
    glow: '0 0 12px hsl(0 86% 67% / 0.18)',
    gradient: 'from-negative/8 to-transparent',
  },
}

function WordCloud({ words, type, t }) {
  const cfg = COLORS[type]

  if (!words || words.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[140px] text-sm text-muted-foreground">
        {t('notEnoughData')}
      </div>
    )
  }

  const shuffled = useMemo(() => {
    const maxCount = words[0]?.count || 1
    const minCount = words[words.length - 1]?.count || 1
    const sized = words.slice(0, 60).map(w => {
      const ratio = maxCount === minCount ? 0.5 : (w.count - minCount) / (maxCount - minCount)
      return { ...w, fontSize: 11 + ratio * 22, opacity: 0.45 + ratio * 0.55 }
    })
    return [...sized].sort(() => Math.random() - 0.5)
  }, [words])

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1.5 items-center min-h-[150px] p-1" role="img" aria-label="Word cloud">
      {shuffled.map((w, i) => (
        <span
          key={i}
          title={`"${w.word}" — ${w.count}x`}
          className="inline-block font-semibold cursor-default rounded transition-all duration-150 hover:scale-110 hover:!opacity-100 animate-fade-in"
          style={{
            fontSize: `${w.fontSize}px`,
            opacity: w.opacity,
            color: cfg.word,
            animationDelay: `${i * 0.015}s`,
            textShadow: w.opacity > 0.8 ? cfg.glow : undefined,
          }}
        >
          {w.word}
        </span>
      ))}
    </div>
  )
}

function PanelCard({ words, type, emoji, labelKey, t }) {
  const cfg = COLORS[type]

  return (
    <Card className={`border-t-2 ${cfg.border} overflow-hidden`}>
      {/* Tinted gradient header zone */}
      <div className={`h-1 w-full bg-gradient-to-b ${cfg.gradient}`} />
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {emoji} {t(labelKey)}
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {words.length} {t('uniqueWords')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <WordCloud words={words} type={type} t={t} />
      </CardContent>
    </Card>
  )
}

export default function WordCloudPanel({ wordFrequencies }) {
  const { positive, negative } = wordFrequencies
  const { t } = useLanguage()

  return (
    <div className="animate-fade-in-up delay-200" id="word-cloud-panel">
      <div className="flex flex-col gap-0.5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shrink-0">
            <span className="text-sm">☁️</span>
          </div>
          <h3 className="font-display text-lg font-bold">{t('wordCloudTitle')}</h3>
        </div>
        <p className="text-sm text-muted-foreground pl-10">{t('wordCloudDesc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PanelCard words={positive} type="positive" emoji="😊" labelKey="positiveComments" t={t} />
        <PanelCard words={negative} type="negative" emoji="😠" labelKey="negativeComments" t={t} />
      </div>
    </div>
  )
}
