import { Globe, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { cn } from '@/lib/utils'

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      {/* Language toggle pill */}
      <button
        id="lang-toggle-btn"
        onClick={toggleLang}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-all duration-200"
        title={lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
      >
        <Globe size={13} />
        <span className="flex items-center gap-1">
          <span className={cn('transition-all', lang === 'id' ? 'text-primary font-bold' : '')}>ID</span>
          <span className="text-border">/</span>
          <span className={cn('transition-all', lang === 'en' ? 'text-primary font-bold' : '')}>EN</span>
        </span>
      </button>
    </div>
  )
}
