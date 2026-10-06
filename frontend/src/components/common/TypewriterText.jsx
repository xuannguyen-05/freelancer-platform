import React, { useState, useEffect } from 'react'

/**
 * TypewriterText
 * Renders text letter-by-letter with configurable typing speed and delay
 */
export default function TypewriterText({ text, speed = 30, delay = 0, className = '' }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
    if (!text) return

    let isMounted = true
    const timer = setTimeout(() => {
      let currentIndex = 0
      const interval = setInterval(() => {
        if (!isMounted) {
          clearInterval(interval)
          return
        }
        currentIndex++
        setDisplayedText(text.slice(0, currentIndex))
        if (currentIndex >= text.length) {
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [text, speed, delay])

  return <span className={className}>{displayedText}</span>
}
