import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)

    const handleThemeChange = (event) => {
      if (event.detail && event.detail !== theme) {
        setTheme(event.detail)
      }
    }

    window.addEventListener('workly-theme-change', handleThemeChange)
    return () => window.removeEventListener('workly-theme-change', handleThemeChange)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    window.dispatchEvent(new CustomEvent('workly-theme-change', { detail: nextTheme }))
  }

  return { theme, toggleTheme, setTheme }
}
