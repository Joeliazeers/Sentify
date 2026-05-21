import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../hooks/useAnalysis'
import { useLanguage } from '../contexts/LanguageContext'
import SearchBar from '../components/SearchBar'
import LoadingOverlay from '../components/LoadingOverlay'
import LanguageToggle from '../components/LanguageToggle'
import { BarChart2, MessageSquare, Globe, Zap } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { status, progress, message, result, error, analyze, reset } = useAnalysis()
  const isLoading = status === 'pending' || status === 'processing'

  const FEATURES = [
    {
      Icon: BarChart2,
      iconCls: 'text-primary bg-primary/10 border-primary/20',
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      Icon: MessageSquare,
      iconCls: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      Icon: Globe,
      iconCls: 'text-positive bg-positive/10 border-positive/20',
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      Icon: Zap,
      iconCls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ]

  if (status === 'completed' && result) {
    navigate('/results', { state: { result } })
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full bg-primary/8 blur-[110px] animate-blob-float" />
        <div className="absolute top-1/2 -right-24 w-[420px] h-[420px] rounded-full bg-positive/5 blur-[100px] animate-blob-float [animation-duration:16s] [animation-direction:reverse]" />
        <div className="absolute -bottom-20 left-[35%] w-[340px] h-[340px] rounded-full bg-purple-500/5 blur-[100px] animate-blob-float [animation-duration:12s] [animation-delay:4s]" />
      </div>

      <div className="container max-w-4xl mx-auto px-6 relative z-10 flex flex-col flex-1">
        {/* Language toggle — fixed top right */}
        <div className="fixed top-4 right-5 z-50">
          <LanguageToggle />
        </div>

        {/* ── Hero ── */}
        <header className="text-center pt-20 pb-10 animate-fade-in-up">
          {/* Model badge */}
          <div className="flex justify-center mb-8 pr-20 sm:pr-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow shrink-0" />
              <span className="truncate">{t('poweredBy')}</span>
            </div>
          </div>

          <h1 className="font-display font-black tracking-tight mb-5">
            <span className="block text-4xl md:text-6xl lg:text-[4.5rem] text-foreground/90 mb-2 leading-none">
              {t('title1')}
            </span>
            <span className="block text-5xl md:text-7xl lg:text-[5.5rem] gradient-text leading-none">
              {t('title2')}
            </span>
          </h1>

          {/* Decorative accent line */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/40" />
          </div>

          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </header>

        {/* ── Search ── */}
        {!isLoading && (
          <div className="animate-fade-in-up delay-100 mb-14">
            <div className="rounded-2xl border border-border/70 bg-card/55 backdrop-blur-md p-4 shadow-2xl">
              <SearchBar onAnalyze={(url) => analyze(url)} isLoading={isLoading} />
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-3 max-w-3xl mx-auto rounded-xl border border-negative/20 bg-negative/8 px-4 py-3 text-sm text-negative">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>
        )}

        {/* ── Loading overlay ── */}
        {isLoading && <LoadingOverlay progress={progress} message={message} onCancel={reset} />}

        {/* ── Feature cards ── */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 animate-fade-in-up delay-200">
            {FEATURES.map(({ Icon, iconCls, title, desc }, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card/70 p-5 hover:border-border/90 hover:-translate-y-1 hover:bg-card transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110 ${iconCls}`}>
                  <Icon size={18} />
                </div>
                <div className="font-display text-sm font-bold mb-1 leading-tight">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-auto py-6 text-center text-xs text-muted-foreground">
          {t('footer')}
        </footer>
      </div>
    </div>
  )
}
