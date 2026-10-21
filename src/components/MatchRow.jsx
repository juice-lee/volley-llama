import { Link } from 'react-router-dom'
import { timeOf, relativeShort, matchPhase } from '../lib/dates'
import { useTeam } from '../lib/store'
import { StatusChip, DateChip, STATUS, displayName } from './ui'

export default function MatchRow({ match, status, result, past, now, onSetStatus }) {
  const { me, players, lineupFor } = useTeam()
  const d = new Date(match.starts_at)
  const phase = matchPhase(match, now || new Date())

  // Answer straight from the list — no need to open the match first.
  const quickPick = onSetStatus && phase === 'upcoming' && !match.lineup_published

  // Once the lineup is posted, the question stops being "can you play?" and
  // becomes "are you playing?" — so the card answers that, in the same spot
  // the answer buttons were.
  const posted = match.lineup_published && phase !== 'past' && me
  const myCourt = posted && lineupFor(match.id).find((c) => c.player1_id === me.id || c.player2_id === me.id)
  const partnerId = myCourt && (myCourt.player1_id === me.id ? myCourt.player2_id : myCourt.player1_id)
  const partner = partnerId && players.find((p) => p.id === partnerId)

  const chip =
    result?.teamWon === true ? <span className="chip win">Won {result.won}-{result.lost}</span> :
    result?.teamWon === false ? <span className="chip loss">Lost {result.won}-{result.lost}</span> :
    phase === 'live' ? <span className="chip accent">Playing now</span> :
    phase === 'past' ? <span className="chip">No score yet</span> :
    quickPick || posted ? null : <StatusChip status={status} />

  return (
    <div className={`card mcard ${past ? 'done' : ''}`}>
      <Link to={`/match/${match.id}`} className="mrow-link">
        <div className="mrow">
          <DateChip date={d} />
          <div className="grow">
            {/* same order as the hero: when, then where, then who */}
            <div className="spread" style={{ gap: 8 }}>
              <div className="mrow-when">
                <span className="mrow-time num">{timeOf(d)}</span>
                {phase === 'upcoming' && <span className="tiny">{relativeShort(d, now)}</span>}
              </div>
              <div className="mrow-meta">
                <span className={`badge ${match.is_home ? 'home' : 'away'}`}>{match.is_home ? 'Home' : 'Away'}</span>
                {chip}
              </div>
            </div>
            <div className="mrow-site truncate">📍 {match.site}</div>
            <div className="mrow-opp truncate">vs {match.opponent}</div>
          </div>
        </div>

        {posted && (myCourt ? (
          <div className="lineup-strip in">
            <span className="lineup-icon" aria-hidden="true">✓</span>
            <div className="grow">
              <div className="lineup-head">You're in the lineup</div>
              <div className="lineup-sub">
                Doubles {myCourt.court}{partner ? ` with ${displayName(partner)}` : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="lineup-strip out">
            <span className="lineup-icon" aria-hidden="true">–</span>
            <div className="lineup-head">You're not in the lineup</div>
          </div>
        ))}
      </Link>

      {quickPick && (
        <div className="quickpick">
          {Object.entries(STATUS).map(([k, v]) => (
            <button
              key={k}
              className={`qp ${k} ${status === k ? 'on' : ''}`}
              aria-pressed={status === k}
              aria-label={v.label}
              onClick={() => onSetStatus(match.id, k)}
            >
              <span className="glyph">{v.glyph}</span>
              <span>{v.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
