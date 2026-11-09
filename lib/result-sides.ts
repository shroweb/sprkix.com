/**
 * Read a Cagematch result line into sides of wrestler names.
 *
 *   "The Vision (Austin Theory & Bron Breakker) (c) defeat Alpha Academy (Akira Tozawa & Otis)"
 *      -> [["Austin Theory","Bron Breakker"], ["Akira Tozawa","Otis"]], winner side 0
 *   "A, B & C defeat D & E and F & G"  -> 3 sides
 *   "A vs. B vs. C (Draw)"             -> 3 sides, no winner
 *
 * Team/stable names written as "Label (Member & Member)" are dropped in favour of the members.
 */
export interface ParsedResult {
  sides: string[][];
  /** Index of the winning side, or null for draws / no result. */
  winner: number | null;
}

const DEFEAT = /\s(?:defeats?|defeated|def\.)\s/i;
const VERSUS = /\s(?:vs\.?|versus)\s/i;

function stripNoise(text: string): string {
  let t = text.replace(/\(\s*\d{1,3}:\d{2}\s*\)/g, " "); // durations
  // Result outcomes tacked on the end: "- TITLE CHANGE !!!", "- No Contest", "by DQ", "by Count Out"
  t = t.replace(/\s+-\s+(?:title change|no contest|time limit draw|draw|double count[- ]?out|double dq)[^()&,]*$/i, " ");
  t = t.replace(/\s+by\s+(?:dq|disqualification|count[- ]?out|referee['’]?s? decision|submission|pinfall|forfeit|tko|ko|knockout|tap out|referee stoppage)\b/gi, " ");
  t = t.replace(/\(w\/[^()]*(?:\([^()]*\)[^()]*)*(?:\)|$)/gi, " "); // (w/ managers) — tolerate a missing ")"
  t = t.replace(/\((?:c|ic|c\.)\)/gi, " "); // champion markers
  t = t.replace(/\((?:time limit draw|draw|no contest|dq|double count[- ]?out|count[- ]?out)[^)]*\)/gi, " ");
  t = t.replace(/\[[^\]]*\]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  // Balance parentheses that were truncated in the source text.
  const open = (t.match(/\(/g) ?? []).length;
  const close = (t.match(/\)/g) ?? []).length;
  if (open > close) t += ")".repeat(open - close);
  return t;
}

/** Replace "Label (A & B)" with "A & B" (groups with members listed in brackets). */
function expandGroups(text: string): string {
  let prev: string;
  let t = text;
  do {
    prev = t;
    t = t.replace(/(?<![\p{L}\p{N}'.-])((?:(?!\band\b)[^,&()])*?)\s*\(([^()]*(?:&|,)[^()]*)\)/gu, (_m, _label, inner) => ` ${inner} `);
  } while (t !== prev);
  // a single-member bracket after a label, e.g. "Team Name (Solo Person)": keep the person.
  t = t.replace(/(?<![\p{L}\p{N}'.-])(?:(?!\band\b)[^,&()])*?\s*\(([^()&,]+)\)/gu, (_m, inner) => ` ${inner} `);
  return t.replace(/\s+/g, " ").trim();
}

function names(chunk: string): string[] {
  return chunk
    .split(/\s*(?:&|,|\band\b)\s*/i)
    .map((n) => n.trim())
    .filter(Boolean);
}

export function parseResultSides(result: string | null | undefined): ParsedResult | null {
  if (!result) return null;
  const cleaned = stripNoise(result);
  const text = ` ${cleaned} `;
  const defeat = text.match(DEFEAT);

  let winnerChunk: string | null = null;
  let rest: string;
  if (defeat) {
    const at = defeat.index!;
    winnerChunk = text.slice(0, at);
    rest = text.slice(at + defeat[0].length);
  } else if (VERSUS.test(text)) {
    rest = text;
  } else {
    return null;
  }

  // Remaining sides are separated by "vs." or " and " (between teams) — but keep "&" / "," inside a side.
  const parts = (winnerChunk ? [winnerChunk] : []).concat(
    rest.split(/\s+vs\.?\s+|\s+versus\s+/i).flatMap((p) => p),
  );

  const sides: string[][] = [];
  for (const [i, part] of parts.entries()) {
    const expanded = expandGroups(part.trim());
    // For trailing losers, " and " separates teams: "C & D and E & F".
    const chunks = i === 0 && winnerChunk ? [expanded] : expanded.split(/\s+and\s+/i);
    for (const c of chunks) {
      const n = names(c);
      if (n.length) sides.push(n);
    }
  }
  if (sides.length < 2) return null;
  return { sides, winner: winnerChunk ? 0 : null };
}
