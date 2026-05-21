import { useState } from 'react'
import { Search, Youtube, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLanguage } from '../contexts/LanguageContext'

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/.test(url)
}

export default function SearchBar({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState('')
  const [touched, setTouched] = useState(false)
  const { t } = useLanguage()

  const isValid = isValidYouTubeUrl(url)
  const showError = touched && url.length > 0 && !isValid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid || isLoading) return
    onAnalyze(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto" id="search-form">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">

        {/* URL Input */}
        <div className={cn(
          "flex-1 flex items-center gap-2 px-4 rounded-xl border bg-secondary/40 transition-all duration-200",
          showError
            ? "border-negative/50 ring-2 ring-negative/20"
            : "border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20"
        )}>
          <Youtube size={18} className="text-muted-foreground shrink-0" />
          <input
            id="youtube-url-input"
            type="url"
            placeholder={t('placeholderUrl')}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-3 disabled:opacity-60"
          />
          {url && (
            <button
              type="button"
              onClick={() => { setUrl(''); setTouched(false) }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Submit */}
        <Button
          id="analyze-btn"
          type="submit"
          size="lg"
          disabled={!isValid || isLoading}
          className="rounded-xl px-6 shrink-0 w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={17} />
          )}
          {isLoading ? t('analyzing') : t('analyze')}
        </Button>
      </div>

      {showError && (
        <p className="mt-2.5 pl-1 text-sm text-negative">
          {t('invalidUrl')}
        </p>
      )}
    </form>
  )
}
