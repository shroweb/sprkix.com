/** Group match participants into sides (teams). Pure + shared by cards, face-offs and recaps. */

export interface SideParticipant {
  team?: number | null;
  isWinner?: boolean | null;
  wrestler: { id: string; name: string; slug?: string; imageUrl?: string | null };
}

export interface Side<T extends SideParticipant = SideParticipant> {
  key: string;
  team: number | null;
  members: T[];
  isWinner: boolean;
}

const TEAM_MATCH = /\b(tag|trios?|six[\s-]?man|eight[\s-]?man|6[\s-]?man|8[\s-]?man)\b/i;

/**
 * Older imports omit team numbers. For an obvious team match with an even field,
 * split the field in half so partners are listed together.
 */
export function inferTeams<T extends SideParticipant>(
  list: T[],
  type?: string | null,
  title?: string | null,
): T[] {
  const given = new Set(list.map((p) => p.team).filter((t) => t != null)).size >= 2;
  if (given || !TEAM_MATCH.test(`${type ?? ""} ${title ?? ""}`) || list.length < 4 || list.length % 2 !== 0) {
    return list;
  }
  const half = list.length / 2;
  return list.map((p, i) => ({ ...p, team: i < half ? 1 : 2 }));
}

export function groupSides<T extends SideParticipant>(list: T[]): Side<T>[] {
  const teamNums = Array.from(new Set(list.map((p) => p.team).filter((t): t is number => t != null)));
  if (teamNums.length >= 2) {
    return teamNums.map((n) => {
      const members = list.filter((p) => p.team === n);
      return { key: `t${n}`, team: n, members, isWinner: members.some((m) => m.isWinner) };
    });
  }
  return list.map((p) => ({ key: p.wrestler.id, team: null, members: [p], isWinner: !!p.isWinner }));
}

/** Position on the card: last match is the main event. */
export function cardPosition(index: number, total: number): "main" | "co-main" | "undercard" {
  if (total >= 2 && index === total - 1) return "main";
  if (total >= 4 && index === total - 2) return "co-main";
  return "undercard";
}
