import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeam } from '../lib/store'

// Captains (is_captain on the roster) always see the Captain tab and are
// unlocked automatically by the store; this screen only appears if that
// didn't happen (no password in the build, a changed password, or the captain
// tapped "Lock"). The flag only controls visibility — every write is still
// password-checked server-side.
export default function CaptainGate({ children }) {
  const { isCaptain, captainPending, me, unlockCaptain } = useTeam()
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (isCaptain) return children
  if (!me?.is_captain) return <Navigate to="/team" replace />

  if (captainPending) {
    return (
      <div className="app center" style={{ paddingTop: '30vh' }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>📋</div>
        <p className="sub mt">Unlocking captain tools…</p>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const ok = await unlockCaptain(pass)
      if (!ok) setErr('That password did not work.')
      // on success isCaptain flips and the captain page renders in place
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app page">
      <div className="center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10vh)' }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>📋</div>
        <div className="eyebrow mt">Captain tools</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Captain password</h1>
        <p className="sub">Lineups, results, and match edits live behind this.<br />This device will remember.</p>
      </div>

      <form onSubmit={submit} className="stack mt2">
        <input
          type="password" value={pass} placeholder="Captain password" autoFocus
          onChange={(e) => { setPass(e.target.value); setErr('') }}
        />
        {err && <div className="notice bad">{err}</div>}
        <button className="btn primary wide" disabled={busy || !pass}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
