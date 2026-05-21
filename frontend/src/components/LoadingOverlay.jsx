import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import TranslatedText from './TranslatedText'
import { X } from 'lucide-react'

const SVG_R = 54
const CIRC = 2 * Math.PI * SVG_R

function formatEta(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return null
  if (seconds < 60) return `~${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `~${m}m ${s}s` : `~${m}m`
}

export default function LoadingOverlay({ progress, message, onCancel }) {
  const { t, lang } = useLanguage()

  // ETA: recalculate rate only when progress changes, then count down each second
  const lastSnapshotRef = useRef({ p: -1, t: 0 })
  const [etaSeconds, setEtaSeconds] = useState(null)

  useEffect(() => {
    const { p: prevP, t: prevT } = lastSnapshotRef.current
    const now = Date.now()

    if (progress > 0 && prevP >= 0 && progress > prevP) {
      const dp = progress - prevP
      const dt = (now - prevT) / 1000
      // Sanity: ignore stale snapshots (>2 min gap means something paused)
      if (dt > 0 && dt < 120) {
        const rate = dp / dt
        const remaining = Math.round((100 - progress) / rate)
        setEtaSeconds(remaining > 0 ? remaining : null)
      }
    }

    lastSnapshotRef.current = { p: progress, t: now }
  }, [progress])

  // Count ETA down by 1 each second
  useEffect(() => {
    if (!etaSeconds || etaSeconds <= 0) return
    const id = setTimeout(() => setEtaSeconds(s => (s > 1 ? s - 1 : null)), 1000)
    return () => clearTimeout(id)
  }, [etaSeconds])

  const STEPS = [
    { label: t('step1'), threshold: 5 },
    { label: t('step2'), threshold: 40 },
    { label: t('step3'), threshold: 50 },
    { label: t('step4'), threshold: 90 },
  ]

  let activeStep = 0
  for (let i = 0; i < STEPS.length; i++) {
    if (progress >= STEPS[i].threshold) activeStep = i
  }

  const dashOffset = CIRC * (1 - progress / 100)

  return (
    <>
      <style>{`
        @keyframes _lo_glow {
          0%, 100% { opacity: 0.10; transform: scale(1); }
          50%       { opacity: 0.26; transform: scale(1.07); }
        }
      `}</style>

      <div className="flex flex-col items-center py-14 px-6 animate-fade-in" id="loading-overlay">

        {/* ── Progress ring ── */}
        <div className="relative mb-10" style={{ width: 200, height: 200 }}>

          {/* Background glow pulse */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(0 84% 60% / 0.16) 0%, transparent 68%)',
            animation: '_lo_glow 2.8s ease-in-out infinite',
          }} />

          {/* SVG ring */}
          <svg width="200" height="200" viewBox="0 0 140 140" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="lo-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="hsl(0 84% 60%)" />
                <stop offset="100%" stopColor="hsl(28 95% 65%)" />
              </linearGradient>
              <filter id="lo-arc-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="70" cy="70" r={SVG_R}
              fill="none" stroke="hsl(222 17% 14%)" strokeWidth="7"
            />
            {/* Progress arc */}
            <circle cx="70" cy="70" r={SVG_R}
              fill="none"
              stroke="url(#lo-arc-grad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
              filter="url(#lo-arc-glow)"
              style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>

          {/* Center: percentage */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {progress}
              <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.45 }}>%</span>
            </span>
            <span style={{
              fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.13em', fontWeight: 600, opacity: 0.4, marginTop: 4,
            }}>
              {lang === 'id' ? 'selesai' : 'done'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-bold mb-2 text-center">
          {t('analyzingComments')}
        </h2>

        {/* Dynamic message */}
        <p className="text-muted-foreground text-sm mb-7 text-center min-h-[20px] max-w-xs">
          <TranslatedText text={message} auto={true} />
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs mb-5">
          {STEPS.map((step, i) => {
            const isDone   = i < activeStep
            const isActive = i === activeStep
            return (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  isDone   ? 'text-foreground/75' :
                  isActive ? 'text-primary font-medium' :
                  'text-muted-foreground/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all duration-300 ${
                  isDone   ? 'bg-positive/10 border-positive/30 text-positive' :
                  isActive ? 'bg-primary/12 border-primary/40 text-primary' :
                  'bg-muted/30 border-border/50'
                }`}>
                  {isDone ? '✓' : isActive ? (
                    <span
                      className="w-2 h-2 rounded-full border border-primary/40"
                      style={{ borderTopColor: 'hsl(var(--primary))', animation: 'spin 0.8s linear infinite' }}
                    />
                  ) : ''}
                </div>
                <span className="leading-tight">{step.label}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-mono text-primary/60 tabular-nums shrink-0">
                    {progress}%
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* ETA badge */}
        <div className="h-7 flex items-center justify-center mb-5">
          {etaSeconds ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/30 border border-border/50 rounded-full px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              {lang === 'id'
                ? `Estimasi selesai dalam ${formatEta(etaSeconds)}`
                : `Estimated ${formatEta(etaSeconds)} remaining`}
            </div>
          ) : progress > 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/40">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30 animate-pulse" />
              {lang === 'id' ? 'Menghitung estimasi...' : 'Calculating estimate...'}
            </div>
          ) : null}
        </div>

        {/* Cancel button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-border/60 bg-card/40 hover:border-negative/50 hover:text-negative hover:bg-negative/5 transition-all duration-200 group"
          >
            <X size={14} className="transition-transform duration-200 group-hover:rotate-90" />
            {lang === 'id' ? 'Batalkan Analisis' : 'Cancel Analysis'}
          </button>
        )}
      </div>
    </>
  )
}
