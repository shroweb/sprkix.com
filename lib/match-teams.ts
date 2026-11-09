/**
 * Derive team numbers + winners for a match from Cagematch-style result text.
 *
 *   "A & B defeat C & D"            -> A,B = team 1 (winners) · C,D = team 2
 *   "A defeats B vs. C"             -> 3 teams (triple threat)
 *   "A & B defeat C & D vs. E & F"  -> 3 teams
 *   "A vs. B (Time Limit Draw)"     -> 2 teams, no winners
 *   Battle royal / Rumble / Chamber -> every wrestler their own team
 *
 * Side separators are "defeat(s)/def./defeated" and "vs."; every separator
 * before a name starts a new team. Pure & dependency-free so it is unit-tested.
 */

const FREE_FOR_ALL = /chamber|rumble|battle royal|scramble|survival|gauntlet|royal rumble/i
const SEPARATOR = /\s(defeats|defeat|defeated|def\.|vs\.?|versus)\s/gi
const DEFEAT_WORDS = new Set(["defeats", "defeat", "defeated", "def."])

export interface TeamAssignment {
  teams: number[]
  winners: boolean[]
}

function clean(text: string): string {
  return text
    .replace(/\(w\/[^)]*\)/gi, " ") // managers / seconds
    .replace(/\(\s*\d{1,3}:\d{2}\s*\)/g, " ") // durations
    .replace(/\s+/g, " ")
}

/** indexOf that only matches whole words (so "A" doesn't hit "defeat"). */
function findWord(hay: string, needle: string, from: number): number {
  let i = hay.indexOf(needle, from)
  while (i !== -1) {
    const before = hay[i - 1]
    const after = hay[i + needle.length]
    if (!(before && /\p{L}/u.test(before)) && !(after && /\p{L}/u.test(after))) return i
    i = hay.indexOf(needle, i + 1)
  }
  return -1
}

export function assignTeams(resultText: string, names: string[]): TeamAssignment {
  const n = names.length
  const text = ` ${clean(resultText)} `
  const lower = text.toLowerCase()

  const seps: { index: number; end: number; defeat: boolean }[] = []
  for (const m of text.matchAll(SEPARATOR)) {
    seps.push({
      index: m.index!,
      end: m.index! + m[0].length,
      defeat: DEFEAT_WORDS.has(m[1].toLowerCase()),
    })
  }

  const individual = (): TeamAssignment => ({
    teams: names.map((_, i) => i + 1),
    winners: names.map((_, i) => seps.some((s) => s.defeat) && i === 0),
  })

  if (FREE_FOR_ALL.test(resultText) && seps.length <= 1) return individual()

  // Locate each name; links arrive in text order so walk a cursor.
  let cursor = 0
  const positions = names.map((name) => {
    const key = name.toLowerCase()
    let at = findWord(lower, key, cursor)
    if (at === -1) at = findWord(lower, key, 0)
    if (at !== -1) cursor = at + key.length
    return at
  })

  if (seps.length === 0) {
    // No separator text at all: free-for-all lists, otherwise one side.
    return /triple threat|three.?way|four.?way|five.?way|six.?way/i.test(resultText)
      ? individual()
      : { teams: names.map(() => 1), winners: names.map(() => false) }
  }

  const hasDefeat = seps[0].defeat
  const teams: number[] = []
  let prev = 1
  for (const pos of positions) {
    let team = prev
    if (pos !== -1) team = 1 + seps.filter((s) => s.end <= pos).length
    teams.push(team)
    prev = team
  }
  // Only the first side wins, and only when the text says someone defeated someone.
  const winners = teams.map((t) => hasDefeat && t === 1)
  return { teams, winners }
}
