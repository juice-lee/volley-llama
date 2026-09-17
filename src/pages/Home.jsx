import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTeam, useNow } from '../lib/store'
import { buildStats } from '../lib/stats'
import { AvailabilityPicker, AvailSplit, Avatar, PickEcho, availableByGender, displayName, mapsUrl } from '../components/ui'
import MatchRow from '../components/MatchRow'
import { dayNameLong, monthDay, timeOf, relativeDay, matchPhase, isPastMatch } from '../lib/dates'

export default function Home() {
  const { matches, players, me, availOf, setAvail, lineupFor, lineups, error } = useTeam()
  const now = useNow()
  const stats = useMemo(() => buildStats({ matches, lineups, now }), [matches, lineups, now])

  const upcoming = matches.filter((m) => !isPastMatch(m, now))
  const next = upcoming[0]
  const season = stats.seasonRecord()
  const active = players.filter((p) => p.active)

  if (!next) {
    return (
      <div className="app">
        <Header season={season} me={me} />
        <div className="card center mt2">
          <div style={{ fontSize: 30 }}>🎾</div>
          <h2 className="h2 mt">Season's done</h2>
          <p className="sub">Final record {season.w}-{season.l}. Check the Team tab for how everyone did.</p>
        </div>
      </div>
    )
  }

  const d = new Date(next.starts_at)
  const phase = matchPhase(next, now)
  const myStatus = availOf(next.id, me.id)
  const courts = next.lineup_published ? lineupFor(next.id) : []
  const myCourt = courts.find((c) => c.player1_id === me.id || c.player2_id === me.id)
  const partnerId = myCourt && (myCourt.player1_id === me.id ? myCourt.player2_id : myCourt.player1_id)
  const partner = players.find((p) => p.id === partnerId)

  const counts = availableByGender(active, (id) => availOf(next.id, id))
  const silent = active.filter((p) => !availOf(next.id, p.id)).length

  return (
    <div className="app">
      <Header season={season} me={me} />

      {error && <div className="notice bad" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card hero">
        <div className="spread">
          <span className="eyebrow">Match {next.match_no} of {matches.length}</span>
          <span className="chip sticker">{phase === 'live' ? 'Playing now 🔥' : relativeDay(d, now) === 'Today' ? 'Today 🎾' : relativeDay(d, now)}</span>
        </div>

        <div style={{ marginTop: 12 }}>
          <h1 className="h1 when">{dayNameLong(d)}, {monthDay(d)}</h1>
          <div className="when-time num">{timeOf(d)}</div>
          <div className="who row" style={{ gap: 8, marginTop: 6 }}>
            <span className={`badge ${next.is_home ? 'home' : 'away'}`}>{next.is_home ? 'Home' : 'Away'}</span>
            <span className="truncate">vs {next.opponent}</span>
          </div>
        </div>

        <a className="btn wide mt" href={mapsUrl(next.site)} target="_blank" rel="noreferrer">
          📍 {next.site}
        </a>

        <div className="divider" />

        {next.lineup_published ? (
          myCourt ? (
            <>
              <div className="notice good cheer">
                You're playing <b>Doubles {myCourt.court}</b>
                {partner ? <> with <b>{displayName(partner)}</b></> : null}
              </div>
              <Link to={`/match/${next.id}`} className="tiny" style={{ display: 'block', marginTop: 8 }}>
                Something come up? Let the captain know ›
              </Link>
            </>
          ) : (
            <div className="notice info">
              You're not in this lineup. {myStatus === 'available' ? 'Thanks for being available — next one.' : ''}
            </div>
          )
        ) : (
          <>
            <div className="spread" style={{ marginBottom: 10 }}>
              <span className="eyebrow">Can you play?</span>
              {myStatus && <span className="tiny">Tap to change</span>}
            </div>
            <AvailabilityPicker value={myStatus} onChange={(s) => setAvail(next.id, me.id, s)} />
            <PickEcho status={myStatus} />
          </>
        )}

        <div className="divider" />

        <div className="spread" style={{ marginBottom: 9 }}>
          <span className="eyebrow">Who's in</span>
          <Link to={`/match/${next.id}`} className="tiny">See everyone ›</Link>
        </div>
        <AvailSplit women={counts.women} men={counts.men} />
        {silent > 0 && (
          <div className="tiny" style={{ marginTop: 9 }}>
            {silent} {silent === 1 ? 'person hasn\'t' : 'people haven\'t'} answered yet.
          </div>
        )}
      </div>

      {upcoming.length > 1 && (
        <>
          <div className="section"><h2 className="h2">After that</h2><Link to="/schedule" className="tiny">All matches ›</Link></div>
          <div className="stack stagger">
            {upcoming.slice(1, 3).map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                now={now}
                status={availOf(m.id, me.id)}
                onSetStatus={(id, st) => setAvail(id, me.id, st)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Header({ season, me }) {
  return (
    <div className="topbar">
      <div>
        <div className="eyebrow">
          Hey {displayName(me).split(' ')[0]} · {season.w + season.l > 0 ? `${season.w}-${season.l}` : 'Fall 2026'}
        </div>
        <h1 className="h1">Volley Llama <span aria-hidden="true">🦙</span></h1>
      </div>
      <Link to="/team" aria-label="Team"><Avatar player={me} lg /></Link>
    </div>
  )
}
