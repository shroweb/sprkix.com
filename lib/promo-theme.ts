/** Per-promotion accent colours + helpers shared by hub pages. */
const ACCENTS: Record<string, string> = {
  WWE: "#e11d48",
  NXT: "#facc15",
  AEW: "#f59e0b",
  TNA: "#38bdf8",
  NJPW: "#ef4444",
  ROH: "#a3a3a3",
  CMLL: "#22c55e",
  AAA: "#8b5cf6",
  GCW: "#fb7185",
  MLW: "#14b8a6",
};

export function promoAccent(shortName: string): string {
  const key = shortName.toUpperCase().replace(/[^A-Z]/g, "");
  return ACCENTS[key] ?? "#a78bfa";
}

/** Map a promotion's short name onto the champions-data promotion code, if any. */
export function promoChampionCode(shortName: string): "WWE" | "AEW" | "NXT" | "TNA" | "NJPW" | "ROH" | null {
  const key = shortName.toUpperCase().replace(/[^A-Z]/g, "");
  return (["WWE", "AEW", "NXT", "TNA", "NJPW", "ROH"] as const).find((c) => c === key) ?? null;
}
