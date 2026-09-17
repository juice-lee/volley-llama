// League rules a lineup has to satisfy, kept apart from the UI so the court
// cards, the slot picker and the auto-suggest all judge a pair the same way.

// USTA 6.0 mixed doubles: the two partners on a court may total at most 6.0 NTRP.
export const MAX_PAIR_NTRP = 6.0

// Ratings come back from Postgres as numerics. Work in tenths so float addition
// can never nudge a legal 6.0 into 6.000000001.
const tenths = (r) => Math.round(Number(r) * 10)

export const isRated = (p) => p?.ntrp != null && p.ntrp !== '' && Number.isFinite(Number(p.ntrp))

export const fmtNtrp = (r) => Number(r).toFixed(1)

// Combined rating of a pair, or null when either rating is unknown.
export const pairNtrp = (a, b) =>
  isRated(a) && isRated(b) ? (tenths(a.ntrp) + tenths(b.ntrp)) / 10 : null

// An unknown rating can't be judged, so it never flags a pair.
export const pairOverCap = (a, b) =>
  isRated(a) && isRated(b) && tenths(a.ntrp) + tenths(b.ntrp) > tenths(MAX_PAIR_NTRP)

// The highest rating that can still partner `p`, or null when p is unrated.
export const maxPartnerNtrp = (p) =>
  isRated(p) ? (tenths(MAX_PAIR_NTRP) - tenths(p.ntrp)) / 10 : null
