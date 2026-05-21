import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { translations } from '../lib/translations'

const LanguageContext = createContext(null)

// Google Translate unofficial endpoint — supports auto source detection, no API key needed
async function translateText(text, targetLang) {
  if (!text || text.trim().length === 0) return { text, sourceLang: targetLang }
  // Google Translate language codes
  const gtLang = targetLang === 'en-US' ? 'en' : targetLang  // 'id', 'en', etc.
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${gtLang}&dt=t&q=${encodeURIComponent(text.slice(0, 1000))}`
    const res = await fetch(url)
    const data = await res.json()
    // Response: [[["translated", "original", null, null, 10], ...], null, "sourceLang"]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map(seg => seg[0]).filter(Boolean).join('')
      const sourceLang = data[2] || gtLang
      if (translated) return { text: translated, sourceLang }
    }
  } catch (_) {/* ignore */}
  return { text, sourceLang: targetLang }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'id')
  // Cache: key = `${text}|${lang}`, value = translated string
  const cacheRef = useRef({})

  const translate = useCallback(async (text) => {
    if (!text) return { text, sourceLang: lang }
    const key = `${lang}|${text}`
    if (cacheRef.current[key]) return cacheRef.current[key]
    const result = await translateText(text, lang === 'en' ? 'en-US' : lang)
    cacheRef.current[key] = result
    return result
  }, [lang])

  const toggleLang = useCallback(() => {
    const newLang = lang === 'id' ? 'en' : 'id'
    localStorage.setItem('appLang', newLang)
    window.location.reload()
  }, [lang])

  const t = useCallback((key) => {
    return translations[lang]?.[key] || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, translate, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
