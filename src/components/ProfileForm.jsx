import { useState } from 'react'
import { useTeam } from '../lib/store'
import { Avatar, displayName } from './ui'

// Shown once when a player first identifies themselves, and reachable later from
// the Stats tab. Everything is pre-filled from the roster. Name and gender are
// the player's to change; phone and Venmo need a captain, because anyone holding
// the public key could otherwise point a teammate's Venmo at themselves.
export default function ProfileForm({ player, onSave, onBack, saveLabel = "Yep, that's me", busy }) {
  const { isCaptain } = useTeam()
  const [preferredName, setPreferredName] = useState(displayName(player))
  const [phone, setPhone] = useState(player.phone || '')
  const [gender, setGender] = useState(player.gender)
  const [venmo, setVenmo] = useState(player.venmo || '')
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!preferredName.trim()) { setErr('Give us something to call you.'); return }
    setErr('')
    try {
      await onSave({
        // storing the roster name again would just be noise
        preferredName: preferredName.trim() === player.name ? null : preferredName.trim(),
        // a locked device sends the stored values back unchanged, so the server
        // never sees a contact edit it would have to refuse
        phone: isCaptain ? phone.trim() : (player.phone || ''),
        gender,
        venmo: isCaptain ? venmo.trim() : (player.venmo || ''),
      })
    } catch (e) {
      setErr(e.message || 'Could not save — check your signal.')
    }
  }

  const contactHint = (what) => (isCaptain ? what : 'Ask a captain to change this')

  return (
    <>
      <div className="center">
        <Avatar player={{ ...player, preferred_name: preferredName, gender }} lg />
        <h1 className="h1 mt">Hi, {preferredName.split(' ')[0] || 'there'}</h1>
        <p className="sub">Check these over — you can change any of it now or later.</p>
      </div>

      <div className="card fieldset mt2">
        <Field label="Preferred name" hint={`On the USTA roster as ${player.name}`}>
          <input type="text" value={preferredName} autoComplete="name"
                 onChange={(e) => setPreferredName(e.target.value)} />
        </Field>

        <Field label="Phone" hint={contactHint('So the captain can reach you about a match')}>
          <input type="tel" inputMode="tel" value={phone} placeholder={isCaptain ? '206-555-0134' : 'Not set'}
                 autoComplete="tel" readOnly={!isCaptain} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        <Field label="Plays as" hint="Every court is one man and one woman">
          <div className="seg">
            {[['F', 'Woman'], ['M', 'Man']].map(([g, label]) => (
              <button key={g} type="button"
                      className={`seg-btn ${gender === g ? 'on' : ''}`}
                      aria-pressed={gender === g}
                      onClick={() => setGender(g)}>
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Venmo" hint={contactHint('For splitting court fees. Optional.')}>
          <div className="prefixed">
            <span className="prefix">@</span>
            <input type="text" value={venmo} placeholder={isCaptain ? 'your-venmo' : 'Not set'} autoCapitalize="none"
                   autoCorrect="off" spellCheck="false" readOnly={!isCaptain}
                   onChange={(e) => setVenmo(e.target.value.replace(/^@+/, ''))} />
          </div>
        </Field>
      </div>

      {err && <div className="notice bad mt">{err}</div>}

      <div className="stack mt2">
        <button className="btn primary wide" disabled={busy} onClick={submit}>
          {busy ? 'Saving…' : `${saveLabel} 🎾`}
        </button>
        {onBack && <button className="btn ghost wide" onClick={onBack}>Pick a different name</button>}
      </div>
    </>
  )
}

const Field = ({ label, hint, children }) => (
  <div>
    <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    {children}
    {hint && <div className="tiny" style={{ marginTop: 5 }}>{hint}</div>}
  </div>
)
