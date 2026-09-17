// Everything the captain looks at is derived from usta_lineups, so there is no
// second source of truth to keep in sync.

const pairKey = (a, b) => [a, b].sort().join('|')

// A drafted lineup for a future match shouldn't inflate anyone's play count, but
// a published one should: that's a commitment the captain already made. Note this
// flips at the start time, not at the end of the match — once you're on court for
// it, it counts toward your total.
export const countsAsPlayed = (match, now) =>
  !!match && (match.lineup_published || new Date(match.starts_at) < now)

export function buildStats({ matches, lineups, now = new Date() }) {
  const matchById = new Map(matches.map((m) => [m.id, m]))
  const byPlayer = new Map()
  const pairs = new Map()
  const courtResults = new Map() // matchId -> {won, lost, pending}

  const seat = (id) => {
    if (!byPlayer.has(id)) {
      byPlayer.set(id, { count: 0, wins: 0, losses: 0, lastMatchNo: null, courts: { 1: 0, 2: 0, 3: 0 }, plays: [] })
    }
    return byPlayer.get(id)
  }

  for (const l of lineups) {
    const m = matchById.get(l.match_id)
    if (!m) continue

    if (l.won !== null && l.won !== undefined) {
      const r = courtResults.get(m.id) || { won: 0, lost: 0 }
      l.won ? r.won++ : r.lost++
      courtResults.set(m.id, r)
    }
    if (!countsAsPlayed(m, now)) continue

    const both = [l.player1_id, l.player2_id].filter(Boolean)
    for (const id of both) {
      const s = seat(id)
      s.count++
      s.courts[l.court]++
      s.plays.push({ matchId: m.id, matchNo: m.match_no, court: l.court, won: l.won, score: l.score, partnerId: both.find((x) => x !== id) || null })
      if (l.won === true) s.wins++
      if (l.won === false) s.losses++
      if (s.lastMatchNo === null || m.match_no > s.lastMatchNo) s.lastMatchNo = m.match_no
    }

    if (both.length === 2) {
      const k = pairKey(both[0], both[1])
      const p = pairs.get(k) || { a: both[0], b: both[1], count: 0, wins: 0, losses: 0, matchNos: [], entries: [] }
      p.count++
      p.matchNos.push(m.match_no)
      p.entries.push({ matchId: m.id, matchNo: m.match_no, won: l.won })
      if (l.won === true) p.wins++
      if (l.won === false) p.losses++
      pairs.set(k, p)
    }
  }

  const blank = { count: 0, wins: 0, losses: 0, lastMatchNo: null, courts: { 1: 0, 2: 0, 3: 0 }, plays: [] }

  const forPlayer = (id) => byPlayer.get(id) || blank

  // Play count excluding one match — what the balance view needs while the
  // captain is mid-edit on that very match.
  const playedExcept = (id, exceptMatchId) => {
    const s = forPlayer(id)
    return s.plays.filter((p) => p.matchId !== exceptMatchId).length
  }

  const pairOf = (a, b) => (a && b ? pairs.get(pairKey(a, b)) || null : null)

  // While the captain is editing a match, that match's own lineup must not count
  // as prior history — otherwise a fresh pick reads back as "already paired".
  const pairOfExcept = (a, b, exceptMatchId) => {
    const p = pairOf(a, b)
    if (!p) return null
    const rest = p.entries.filter((e) => e.matchId !== exceptMatchId)
    if (rest.length === 0) return null
    return {
      ...p,
      count: rest.length,
      wins: rest.filter((e) => e.won === true).length,
      losses: rest.filter((e) => e.won === false).length,
      matchNos: rest.map((e) => e.matchNo),
    }
  }

  const lastPlayedExcept = (id, exceptMatchId) => {
    const rest = forPlayer(id).plays.filter((p) => p.matchId !== exceptMatchId)
    return rest.length ? Math.max(...rest.map((p) => p.matchNo)) : null
  }

  const partnersOf = (id) =>
    [...pairs.values()]
      .filter((p) => p.a === id || p.b === id)
      .map((p) => ({ ...p, partnerId: p.a === id ? p.b : p.a }))
      .sort((x, y) => y.count - x.count)

  const resultFor = (matchId) => {
    const r = courtResults.get(matchId)
    if (!r || r.won + r.lost === 0) return null
    return { ...r, decided: r.won >= 2 || r.lost >= 2, won: r.won, lost: r.lost, teamWon: r.won >= 2 ? true : r.lost >= 2 ? false : null }
  }

  // Team record on each of the three courts, for the stats page.
  const courtRecord = () => {
    const out = { 1: { w: 0, l: 0 }, 2: { w: 0, l: 0 }, 3: { w: 0, l: 0 } }
    for (const l of lineups) {
      if (l.won === true) out[l.court].w++
      else if (l.won === false) out[l.court].l++
    }
    return out
  }

  const courtTotals = () => {
    let w = 0, l = 0
    for (const row of lineups) {
      if (row.won === true) w++
      else if (row.won === false) l++
    }
    return { w, l }
  }

  const seasonRecord = () => {
    let w = 0, l = 0
    for (const m of matches) {
      const r = resultFor(m.id)
      if (r?.teamWon === true) w++
      else if (r?.teamWon === false) l++
    }
    return { w, l }
  }

  return {
    forPlayer, playedExcept, lastPlayedExcept, pairOf, pairOfExcept, partnersOf,
    resultFor, seasonRecord, courtRecord, courtTotals, pairs: [...pairs.values()],
  }
}


// Human-readable record; the compact form below is for tight table rows.
// Compact form for tight rows, where the long phrase wraps and breaks the rhythm.
export const recordShort = (w, l) => (w + l === 0 ? '–' : `${w}-${l}`)

export const winPct = (w, l) => (w + l === 0 ? null : Math.round((w / (w + l)) * 100))
export const winPctText = (w, l) => (w + l === 0 ? '–' : `${winPct(w, l)}%`)
