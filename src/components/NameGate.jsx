import { useEffect, useMemo, useRef, useState } from 'react'
import { useTeam } from '../lib/store'
import { Avatar, displayName } from './ui'
import ProfileForm from './ProfileForm'

// No password: on a 13-person team an unlisted link is the gate. You tell the app
// who you are once, and it remembers on this device.
export default function NameGate() {
  const { players, chooseMe, saveProfile } = useTeam()
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const active = useMemo(() => players.filter((p) => p.active), [players])
  const q = query.trim().toLowerCase()
  const matches = useMemo(
    () => (q
      ? active.filter((p) => `${p.name} ${p.preferred_name || ''}`.toLowerCase().includes(q))
      : active),
    [active, q],
  )

  useEffect(() => { setHi(0) }, [q])

  useEffect(() => {
    if (!open) return
    const away = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const choose = (p) => { setPicked(p); setOpen(false) }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setHi((i) => {
        const n = matches.length
        if (!n) return 0
        return (i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (matches[hi]) choose(matches[hi])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (picked) {
    return (
      <div className="app page" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6vh)' }}>
        <ProfileForm
          player={picked}
          busy={busy}
          onBack={() => { setPicked(null); setQuery('') }}
          onSave={async (fields) => {
            setBusy(true)
            try {
              await saveProfile(picked.id, fields)
              chooseMe(picked.id)
            } finally {
              setBusy(false)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8vh)' }}>
        <div style={{ fontSize: 46, lineHeight: 1 }}>🦙🎾</div>
        <div className="eyebrow mt">Volley Llama · Fall 2026</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Who's playing?</h1>
        <p className="sub">Pick your name to see the schedule and set your availability.</p>
      </div>

      <div className="combo mt2" ref={wrapRef}>
        <div className="combo-field" onClick={() => { setOpen(true); inputRef.current?.focus() }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Start typing your name…"
            aria-label="Your name"
            aria-expanded={open}
            role="combobox"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          <span className={`caret ${open ? 'open' : ''}`} aria-hidden="true">▼</span>
        </div>

        {open && (
          <div className="combo-menu" role="listbox">
            {matches.length === 0 ? (
              <div className="combo-empty">
                <div className="sub">No one on the roster matches "{query.trim()}".</div>
                <button className="btn sm ghost mt" onClick={() => setQuery('')}>Show everyone</button>
              </div>
            ) : (
              matches.map((p, i) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={i === hi}
                  className={`combo-opt ${i === hi ? 'hi' : ''}`}
                  onPointerEnter={() => setHi(i)}
                  onClick={() => choose(p)}
                >
                  <Avatar player={p} />
                  <div className="grow">
                    <div style={{ fontWeight: 800 }}>{displayName(p)}</div>
                    <div className="tiny">{p.gender === 'F' ? 'Women' : 'Men'} · {Number(p.ntrp).toFixed(1)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!open && (
        <p className="tiny center mt2">
          Tap the box to see the whole roster, or type a few letters.
        </p>
      )}
    </div>
  )
}
