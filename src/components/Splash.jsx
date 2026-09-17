import { useCallback, useEffect, useState } from 'react'

const PLAY_MS = 1500    // the swing + settle
const REVEAL_MS = 720   // the curtains parting
const MAX_WAIT_MS = 4500 // never hold the app hostage to a slow network
const KEY = 'vl_splash_seen'

// Decided once when the module loads, so React's StrictMode double-invoking a
// lazy initializer can't consume the "already seen" flag before it's used.
// Once per session: a home-screen launch gets the show, a refresh doesn't.
export const PLAY_SPLASH = (() => {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    if (sessionStorage.getItem(KEY)) return false
    sessionStorage.setItem(KEY, '1')
    return true
  } catch {
    return true // private mode: better to play it than to crash
  }
})()

export default function Splash({ ready, onOpen, onDone }) {
  const [played, setPlayed] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPlayed(true), PLAY_MS)
    const bail = setTimeout(() => setPlayed('force'), MAX_WAIT_MS)
    return () => { clearTimeout(t); clearTimeout(bail) }
  }, [])

  // Hold the curtains until the intro has run AND the season has loaded, so the
  // splash doubles as the loading screen instead of handing off to a second one.
  useEffect(() => {
    if (leaving || !played) return
    if (!ready && played !== 'force') return
    setLeaving(true)
    onOpen?.()
  }, [played, ready, leaving, onOpen])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => onDone?.(), REVEAL_MS)
    return () => clearTimeout(t)
  }, [leaving, onDone])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const skip = useCallback(() => setPlayed('force'), [])

  return (
    <div
      className={`splash ${leaving ? 'leaving' : ''}`}
      onClick={skip}
      role="presentation"
      aria-hidden="true"
    >
      <div className="curtain top" />
      <div className="curtain bottom" />

      <div className="scene">
        <div className="impact" />

        <div className="flyer">
          <div className="hop">
            <div className="settle">
              <div className="squash">
                <div className="spin">
                  <svg viewBox="0 0 100 100" className="ballsvg">
                    <circle cx="50" cy="50" r="45" fill="#DCF24F" stroke="#B9D42B" strokeWidth="2.5" />
                    <path
                      d="M13 24c15 13 20 46 11 60M87 24c-15 13-20 46-11 60"
                      stroke="#ffffff" strokeWidth="5.5" fill="none" strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="racquet">
          <svg viewBox="0 0 120 230">
            <rect x="52" y="140" width="16" height="82" rx="8" fill="#22303A" />
            <rect x="47" y="188" width="26" height="36" rx="9" fill="#cf6c3c" />
            <ellipse cx="60" cy="80" rx="50" ry="66" fill="rgba(255,255,255,0.65)" stroke="#22303A" strokeWidth="9" />
            <g stroke="#22303A" strokeWidth="2" opacity="0.35">
              <path d="M28 24v112M44 17v126M60 15v130M76 17v126M92 24v112" />
              <path d="M14 48h92M12 68h96M12 88h96M14 108h92M20 128h80" />
            </g>
          </svg>
        </div>

        <div className="splash-word">
          <div className="wm">Volley Llama</div>
          <div className="wm-sub">Fall 2026 · 3.0 Mixed</div>
        </div>
      </div>
    </div>
  )
}
