import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayName, monthDay } from '../lib/dates'

// `name` is the USTA roster name; `preferred_name` is what the player asked to
// be called. Everything player-facing goes through this.
export const displayName = (p) => (p?.preferred_name || '').trim() || p?.name || ''

export const venmoUrl = (handle) => `https://venmo.com/u/${encodeURIComponent(handle)}`

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const firstName = (name = '') => name.split(/\s+/)[0]

// Calendar tear-off. The season runs Sept-Nov, so the month has to be on it —
// "16" alone could be three different matches.
export const DateChip = ({ date }) => {
  const [mon, day] = monthDay(date).split(' ')
  return (
    <div className="mdate">
      <div className="m">{mon}</div>
      <div className="n num">{day}</div>
      <div className="d">{dayName(date)}</div>
    </div>
  )
}

export const Avatar = ({ player, lg }) => (
  <div className={`av ${lg ? 'lg' : ''} ${player?.gender === 'F' ? 'f' : 'm'}`}>{initials(displayName(player))}</div>
)

export const STATUS = {
  available: { label: 'Available', short: 'Available', glyph: '🎾' },
  maybe: { label: 'Not sure yet', short: 'Maybe', glyph: '🤔' },
  out: { label: 'Not available', short: 'Out', glyph: '🙅' },
}

export const StatusChip = ({ status }) =>
  status ? <span className={`chip ${status}`}>{STATUS[status].short}</span>
         : <span className="chip">No answer</span>

// Three courts need three men and three women, so a single "7 available" hides
// the thing that actually decides whether a lineup is possible.
export const NEED_PER_GENDER = 3

// A count answers "how many"; the captain's next question is always "who".
// Hover covers a laptop (pure CSS), tap and keyboard cover the phone — which is
// where lineups actually get set. The panel is anchored to the row rather than
// the chip so a long list can't run off the edge of a narrow screen.
export function NameTip({ names = [], className = '', children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  if (!names.length) return children

  return (
    <span
      ref={ref}
      className={['nametip-wrap', className, open && 'open'].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label={names.join(', ')}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) }
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      {children}
      <span className="nametip">{names.join(' \u00B7 ')}</span>
    </span>
  )
}

export function AvailSplit({ women, men, compact, names }) {
  const cell = (label, n, who) => {
    const tile = (
      <div key={label} className={compact ? 'avail-pill' : 'card flat grow avail-tile'}>
        <div className="eyebrow">{label}</div>
        <div className={`avail-n num ${n >= NEED_PER_GENDER ? 'ok' : 'low'}`}>{n}</div>
        {!compact && (
          <div className="tiny">
            {n >= NEED_PER_GENDER ? 'available' : `need ${NEED_PER_GENDER - n} more`}
          </div>
        )}
      </div>
    )
    return who ? <NameTip key={label} names={who} className="tipfill">{tile}</NameTip> : tile
  }
  return (
    <div
      className={`${compact ? 'row avail-row' : 'row'}${names ? ' nametip-row' : ''}`}
      style={{ gap: 9, alignItems: 'stretch' }}
    >
      {cell('Women', women, names?.women)}
      {cell('Men', men, names?.men)}
    </div>
  )
}

export const availableByGender = (players, statusOf) => ({
  women: players.filter((p) => p.gender === 'F' && statusOf(p.id) === 'available').length,
  men: players.filter((p) => p.gender === 'M' && statusOf(p.id) === 'available').length,
})

export function AvailabilityPicker({ value, onChange }) {
  return (
    <div className="picker">
      {Object.entries(STATUS).map(([k, v]) => (
        <button
          key={k}
          className={`pick ${k} ${value === k ? 'on' : ''}`}
          aria-pressed={value === k}
          onClick={() => onChange(k)}
        >
          <span className="glyph">{v.glyph}</span>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  )
}

// One line of warmth after a tap — keyed by status so it re-animates on change.
const ECHO = {
  available: "You're in! 🎾",
  maybe: 'No rush — flip it when you know.',
  out: "Bummer — we'll miss you.",
}
export const PickEcho = ({ status }) =>
  status ? <div key={status} className="echo">{ECHO[status]}</div> : null

export function Sheet({ title, onClose, children }) {
  // onClose is an inline arrow at every call site, so hold it in a ref and run
  // the lock/listener setup exactly once per open.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Dismissal gets the same physics as arrival: play the exit, then unmount.
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    setClosing((already) => {
      if (!already) setTimeout(() => closeRef.current(), 170)
      return true
    })
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc) }
  }, [close])

  // Portaled to <body>: the page wrapper's fade animation makes it a stacking
  // context, which would trap the scrim underneath the root-level tab bar.
  return createPortal(
    <div className={`scrim ${closing ? 'closing' : ''}`} onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {title && (
          <div className="spread" style={{ marginBottom: 12 }}>
            <h2 className="h2">{title}</h2>
            <button className="btn sm ghost" onClick={close}>Close</button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export const mapsUrl = (site) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site}, Seattle WA`)}`

// Resolves true only if something actually landed on the clipboard. The async
// API rejects more than you'd think — iOS home-screen apps throw NotAllowedError
// — so a rejection falls through to the old select-and-copy path instead of
// dying silently, and callers can tell the captain when neither worked.
export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true } catch { /* fall through */ }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '') // keeps the iOS keyboard down while focused
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'
  document.body.appendChild(ta)
  try {
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, text.length) // iOS ignores select() on its own
    return document.execCommand('copy') === true
  } catch { return false } finally { document.body.removeChild(ta) }
}

// Portaled like Sheet: the page wrapper animates with a transform, which would
// make it the containing block and pin a fixed toast to the page, not the screen.
export const Toast = ({ children }) =>
  children ? createPortal(<div className="notice good toast">{children}</div>, document.body) : null
