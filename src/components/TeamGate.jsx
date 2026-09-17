import { useState } from 'react'
import { checkTeamKey, setTeamOk } from '../lib/identity'

// First-visit password. Cleared once, remembered forever on this device.
export default function TeamGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [err, setErr] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (checkTeamKey(value)) {
      setTeamOk()
      onUnlock()
    } else {
      setErr(true)
    }
  }

  return (
    <div className="app center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14vh)' }}>
      <div style={{ fontSize: 52, lineHeight: 1 }}>🦙</div>
      <div className="eyebrow mt">Volley Llama · Fall 2026</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Team members only</h1>
      <p className="sub">Ask the captain for the team password.<br />You'll only be asked once.</p>

      <form onSubmit={submit} className="stack mt2" style={{ textAlign: 'left' }}>
        <input
          type="text"
          value={value}
          placeholder="Team password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
          onChange={(e) => { setValue(e.target.value); setErr(false) }}
        />
        {err && <div className="notice bad">That's not it — check with the captain.</div>}
        <button className="btn primary wide" disabled={!value.trim()}>Let me in 🎾</button>
      </form>
    </div>
  )
}
