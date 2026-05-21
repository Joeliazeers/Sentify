import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Loader2, Languages } from 'lucide-react'

/**
 * Renders comment text with auto-translate support.
 * If auto is true, translates on mount (shows spinner while translating).
 * If auto is false, silently fetches translation on mount to detect language,
 * and shows original text + a manual translate button ONLY IF languages differ.
 */
export default function TranslatedText({ text, className = '', auto = false }) {
  const { lang, translate, t } = useLanguage()
  const [translatedObj, setTranslatedObj] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  // Fetch translation on mount (silently if auto is false)
  useEffect(() => {
    if (!text) {
      setTranslatedObj(null)
      setShowTranslation(false)
      setLoading(false)
      return
    }

    let cancelled = false
    if (auto) setLoading(true)

    translate(text).then(result => {
      if (!cancelled) {
        setTranslatedObj(result)
        if (auto) {
          setLoading(false)
          setShowTranslation(true)
        }
      }
    })
    return () => { cancelled = true }
  }, [text, lang, translate, auto])

  // Determine if we should even show the translation button
  // 1. If translatedObj is not yet loaded, we don't know the source language.
  // 2. If it's loaded, we check if the source language matches the target UI language.
  // GT returns 'id', 'en', 'ms' etc. Our lang state is 'id' or 'en'.
  // We can just check if sourceLang starts with the target lang (e.g. 'en' matches 'en-US' or 'en').
  // Alternatively, if the translated text is exactly the same as the original text, there's no point in translating.
  let showButton = false
  if (!auto && translatedObj) {
    const isSameLang = translatedObj.sourceLang && translatedObj.sourceLang.toLowerCase().startsWith(lang)
    const isSameText = translatedObj.text.trim() === text.trim()
    showButton = !isSameLang && !isSameText
  }

  const handleTranslateClick = () => {
    setShowTranslation(p => !p)
  }

  const displayText = showTranslation && translatedObj ? translatedObj.text : text

  return (
    <span className={className}>
      {loading && auto ? (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Loader2 size={11} className="animate-spin shrink-0" />
          <span className="opacity-60 text-[11px]">{t('translating')}</span>
        </span>
      ) : (
        <>
          {displayText}
          {showButton && (
            <button
              onClick={handleTranslateClick}
              title={showTranslation ? t('showOriginal') : t('translate')}
              className="inline-flex items-center justify-center ml-2 p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
            >
              <Languages size={14} />
            </button>
          )}
        </>
      )}
    </span>
  )
}
