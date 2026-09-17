import { useMemo } from 'react'
import { useTeam, useNow } from '../lib/store'
import { buildStats } from '../lib/stats'
import MatchRow from '../components/MatchRow'
import { isPastMatch } from '../lib/dates'

export default function Schedule() {
  const { matches, lineups, me, availOf, setAvail } = useTeam()
  const now = useNow()
  const stats = useMemo(() => buildStats({ matches, lineups, now }), [matches, lineups, now])

  const past = matches.filter((m) => isPastMatch(m, now))
  const upcoming = matches.filter((m) => !isPastMatch(m, now))

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <div className="eyebrow">{matches.length} matches · Fall 2026</div>
          <h1 className="h1">Schedule</h1>
        </div>
      </div>

      {upcoming.length > 0 && (
        <>
          <div className="section"><h2 className="h2">Coming up</h2></div>
          <div className="stack stagger">
            {upcoming.map((m) => (
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

      {past.length > 0 && (
        <>
          <div className="section"><h2 className="h2">Played</h2></div>
          <div className="stack stagger">
            {past.slice().reverse().map((m) => (
              <MatchRow key={m.id} match={m} past now={now} result={stats.resultFor(m.id)} status={availOf(m.id, me.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
