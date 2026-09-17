import { useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTeam, useNow } from '../lib/store'
import { buildStats } from '../lib/stats'
import { AvailabilityPicker, AvailSplit, Avatar, PickEcho, availableByGender, displayName, mapsUrl } from '../components/ui'
import { dayNameLong, monthDay, timeOf, relativeDay, matchPhase } from '../lib/dates'

const GROUPS = [
  ['available', 'Available'],
  ['maybe', 'Not sure yet'],
  ['out', 'Not available'],
  ['none', 'No answer yet'],
]

export default function MatchDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { matches, players, lineups, me, availOf, setAvail, lineupFor, isCaptain } = useTeam()
  const now = useNow()
  const stats = useMemo(() => buildStats({ matches, lineups, now }), [matches, lineups, now])

  const match = matches.find((m) => m.id === id)
  if (!match) return <div className="app"><div className="topbar" /><p className="sub">Match not found.</p></div>

  const d = new Date(match.starts_at)
  const phase = matchPhase(match, now)
  const past = phase === 'past'
  const active = players.filter((p) => p.active)
  const courts = lineupFor(match.id)
  const result = stats.resultFor(match.id)
  const showLineup = match.lineup_published || past
  const nameOf = (pid) => displayName(players.find((p) => p.id === pid)) || '—'

  const grouped = GROUPS.map(([k, label]) => [
    label,
    k,
    active.filter((p) => (availOf(match.id, p.id) || 'none') === k),
  ])

  return (
    <div className="app">
      <div className="topbar">
        <button className="btn sm ghost" onClick={() => nav(-1)}>‹ Back</button>
        {isCaptain && <Link className="btn sm" to={`/captain/${match.id}`}>Lineup tools</Link>}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <span className={`badge ${match.is_home ? 'home' : 'away'}`}>{match.is_home ? 'Home' : 'Away'}</span>
        <span className="eyebrow">Match {match.match_no}</span>
      </div>
      <h1 className={`h1 ${match.opponent.length > 20 ? 'h1-long' : ''}`} style={{ marginTop: 6 }}>
        vs {match.opponent}
      </h1>
      <div className="sub num">
        <b style={{ color: 'var(--text)' }}>{dayNameLong(d)}, {monthDay(d)}</b>
        {' · '}<b style={{ color: 'var(--accent-text)' }}>{timeOf(d)}</b>
        {' · '}{phase === 'live' ? 'Playing now' : relativeDay(d, now)}
      </div>

      {result && (
        <div className={`notice ${result.teamWon === true ? 'good' : result.teamWon === false ? 'bad' : 'info'} mt`}>
          {result.teamWon === true ? 'Won' : result.teamWon === false ? 'Lost' : 'In progress'} {result.won}-{result.lost} on courts
        </div>
      )}

      <div className="stack stagger mt">
        <a className="btn wide" href={mapsUrl(match.site)} target="_blank" rel="noreferrer">📍 {match.site}</a>
        <button className="btn wide ghost" onClick={() => addToCalendar(match)}>📅 Add to calendar</button>
      </div>

      {match.notes && <div className="notice info mt">{match.notes}</div>}

      {!past && (
        <>
          <div className="section"><h2 className="h2">Can you play?</h2></div>
          {match.lineup_published && (
            <div className="notice warn" style={{ marginBottom: 10 }}>
              The lineup is already posted. If something changed, update this <b>and</b> text the captain —
              they need to find a sub.
            </div>
          )}
          <AvailabilityPicker value={availOf(match.id, me.id)} onChange={(s) => setAvail(match.id, me.id, s)} />
          <PickEcho status={availOf(match.id, me.id)} />
        </>
      )}

      {showLineup && courts.length > 0 && (
        <>
          <div className="section"><h2 className="h2">Lineup</h2></div>
          <div>
            {courts.map((c) => {
              const mine = c.player1_id === me.id || c.player2_id === me.id
              return (
                <div key={c.court} className={`court ${mine ? 'mine' : ''}`}>
                  <div className="spread">
                    <span className="eyebrow">Doubles {c.court}</span>
                    {c.won === true && <span className="chip win">Won {c.score || ''}</span>}
                    {c.won === false && <span className="chip loss">Lost {c.score || ''}</span>}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    {nameOf(c.player1_id)} <span style={{ color: 'var(--dimmer)' }}>+</span> {nameOf(c.player2_id)}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="section"><h2 className="h2">Who's in</h2></div>
      <AvailSplit {...availableByGender(active, (id) => availOf(match.id, id))} />
      <div className="card mt" style={{ padding: 8 }}>
        {grouped.map(([label, k, list]) =>
          list.length === 0 ? null : (
            <div key={k} style={{ padding: '6px 4px 10px' }}>
              <div className="row" style={{ gap: 7, padding: '4px 6px' }}>
                <i className={`dot ${k === 'none' ? '' : k}`} />
                <span className="eyebrow">{label} · {list.length}</span>
              </div>
              {list.map((p) => (
                <div key={p.id} className="pickrow" style={{ paddingTop: 7, paddingBottom: 7 }}>
                  <Avatar player={p} />
                  <div className="grow">
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{displayName(p)}{p.id === me.id ? ' (you)' : ''}</div>
                  </div>
                  <span className="tiny num">{stats.forPlayer(p.id).count} played</span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>

      {match.opponent_captain && (
        <>
          <div className="section"><h2 className="h2">Their captain</h2></div>
          <div className="card"><div className="sub" style={{ whiteSpace: 'pre-line' }}>{match.opponent_captain}</div></div>
        </>
      )}
    </div>
  )
}

function addToCalendar(match) {
  const start = new Date(match.starts_at)
  const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000)
  const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Volley Llama//EN', 'BEGIN:VEVENT',
    `UID:usta-${match.match_no}@volleyllama`,
    `DTSTAMP:${z(new Date())}`,
    `DTSTART:${z(start)}`,
    `DTEND:${z(end)}`,
    `SUMMARY:Tennis vs ${match.opponent}`,
    `LOCATION:${match.site}`,
    `DESCRIPTION:USTA 3.0 Mixed · ${match.is_home ? 'Home' : 'Away'} · Match ${match.match_no}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `match-${match.match_no}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
