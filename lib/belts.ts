// Championship detection + original belt artwork.
//
// Titles only exist as free text on matches ("WWE World Heavyweight  Title Match"),
// so we parse that text, pick a visual style for it, and draw a belt as SVG.
// The artwork is generated here — it is not a photo of any real belt.

export type Metal = "gold" | "silver" | "bronze" | "rose" | "purple";
export type Strap = "black" | "brown" | "navy" | "red";

export interface BeltStyle {
  metal: Metal;
  strap: Strap;
  /** Two small plates instead of one big one. */
  tag: boolean;
}

export interface ParsedChampionship {
  /** Display name, e.g. "WWE World Heavyweight Championship". */
  name: string;
  /** Raw title text from the match type, e.g. "WWE World Heavyweight". */
  base: string;
  /** Short centre-plate label, e.g. "WWE". */
  label: string;
  style: BeltStyle;
}

const PROMO_RE = /^(WWE|WWF|WCW|ECW|AEW|TNA|ROH|NJPW|IWGP|NOAH|GHC|AJPW|STARDOM|NXT|MLW|CMLL|AAA|NWA|DDT|AIW|PWG|EVOLVE|WXW)\b/i;
const KEYWORD_RE =
  /heavyweight|cruiserweight|openweight|tag team|trios|world|intercontinental|united states|\bus\b|continental|television|\btv\b|women'?s|knockouts|x-division|junior|european|hardcore|crown jewel|triple crown|world title|championship|national|speed|iwgp|nxt|ring of honor|mid-?atlantic|international/i;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Pull the championship out of a match type/title, or null if it isn't a title match. */
export function parseChampionship(...candidates: (string | null | undefined)[]): ParsedChampionship | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const text = clean(raw);
    if (/^non[\s-]?title/i.test(text) || /\bno\s+title\b/i.test(text)) continue;
    const m = text.match(/^(.*?)\s+(?:Championship|Title)(?:\s+(?:Match|Defense|Defence))?$/i);
    if (!m) continue;
    const base = clean(m[1]);
    if (!base || (!PROMO_RE.test(base) && !KEYWORD_RE.test(base))) continue;

    const promo = base.match(PROMO_RE)?.[1]?.toUpperCase() ?? null;
    return {
      name: `${base} Championship`,
      base,
      label: promo ?? initials(base),
      style: styleFor(base, promo),
    };
  }
  return null;
}

export function initials(text: string): string {
  const words = text.split(" ").filter((w) => /[a-z]/i.test(w) && w.length > 2);
  return (words.slice(0, 3).map((w) => w[0]).join("") || "★").toUpperCase();
}

const STRAP_BY_PROMO: Record<string, Strap> = {
  WWE: "black", WWF: "black", WCW: "navy", ECW: "red", AEW: "black", TNA: "navy",
  ROH: "red", NJPW: "black", IWGP: "black", NOAH: "navy", AJPW: "brown", STARDOM: "red",
  NXT: "navy", MLW: "black", NWA: "brown",
};

export function styleFor(base: string, promo: string | null): BeltStyle {
  const b = base.toLowerCase();
  const tag = /tag team|trios|tag\b/.test(b);

  let metal: Metal = "gold";
  if (/crown jewel|king of the ring|queen of the ring|money in the bank/.test(b)) metal = "purple";
  else if (/women'?s|knockouts|joshi|stardom/.test(b)) metal = "rose";
  else if (/intercontinental|united states|\bus\b|continental|national|television|\btv\b|\btnt\b|x-division|junior|cruiserweight|speed|international|european/.test(b)) metal = "silver";
  else if (/hardcore|mid-?atlantic|hawaiian|regional/.test(b)) metal = "bronze";
  else if (/world|heavyweight|openweight|iwgp|championship/.test(b)) metal = "gold";

  const strap: Strap = (promo && STRAP_BY_PROMO[promo]) || (metal === "bronze" ? "brown" : "black");
  return { metal, strap, tag };
}

/** Style for an arbitrary title name (used by lineal titles, which aren't parsed from a match). */
export function styleForName(name: string): BeltStyle {
  return styleFor(name, name.match(PROMO_RE)?.[1]?.toUpperCase() ?? null);
}

/**
 * Real belt photo (transparent webp in /public/belts) for a title name, or
 * null when we don't have one — callers then fall back to the generated art.
 */
export function photoFor(name: string): string | null {
  const n = name.toLowerCase().replace(/[’]/g, "'");
  const has = (re: RegExp) => re.test(n);
  const file = (f: string) => `/belts/${f}.webp`;
  const womens = has(/\bwomen'?s\b/);
  const tag = has(/\btag\b/);

  // NXT
  if (has(/\bnxt\b/)) {
    if (has(/\buk\b|united kingdom/)) {
      if (tag) return file("nxt-uk-tag-team-championship");
      if (womens) return file("nxt-uk-womens-championship");
      return file("nxt-uk-championship");
    }
    if (has(/heritage/)) return file("nxt-heritage-cup");
    if (tag) return file(womens ? "nxt-womens-tag-team-championship" : "nxt-tag-team-championship");
    if (has(/north american/)) return file(womens ? "nxt-womens-north-american-championship" : "nxt-north-american-championship");
    if (has(/cruiserweight/)) return file("nxt-cruiserweight-championship");
    return file(womens ? "nxt-womens-championship" : "nxt-championship");
  }

  // AEW
  if (has(/\baew\b/) || has(/real world (championship|title)/)) {
    if (has(/trios/)) return file("aew-world-trios-championship");
    if (tag) return file("aew-tag-team-championship");
    if (womens) return file(has(/tbs/) ? "aew-tbs-championship" : "aew-womens-world-championship");
    if (has(/\btnt\b/)) return file("aew-tnt-championship");
    if (has(/\btbs\b/)) return file("aew-tbs-championship");
    if (has(/international|all[\s-]?atlantic/)) return file("aew-international-championship");
    if (has(/continental/)) return file("aew-continental-championship");
    if (has(/world/) || has(/real world/)) return file("aew-world-championship");
    return file("aew-world-championship");
  }
  if (has(/\btnt (championship|title)\b/)) return file("aew-tnt-championship");
  if (has(/\btbs (championship|title)\b/)) return file("aew-tbs-championship");

  // TNA / Impact
  if (has(/\b(tna|impact)\b/) || has(/x[\s-]?division/) || has(/knockouts/)) {
    if (tag) return file("tna-world-tag-team-championship");
    if (has(/knockouts/)) return file("tna-knockouts-world-championship");
    if (has(/x[\s-]?division/)) return file("tna-x-division-championship");
    return file("tna-world-championship");
  }

  // ROH
  if (has(/\b(roh|ring of honor)\b/)) {
    if (tag) return file("roh-tag-team-championship");
    if (has(/pure/)) return file("roh-pure-championship");
    if (has(/television|\btv\b/)) return file("roh-television-championship");
    return file("roh-world-championship");
  }

  // NJPW / IWGP
  if (has(/\b(njpw|iwgp)\b/)) {
    if (tag) return file("iwgp-tag-team-championship");
    if (has(/global/)) return file("iwgp-global-heavyweight-championship");
    if (has(/junior|jr\.?/)) return file("iwgp-junior-heavyweight-championship");
    if (has(/world heavyweight/)) return file("iwgp-world-heavyweight-championship");
    if (has(/heavyweight/)) return file("iwgp-heavyweight-championship");
    return file("iwgp-world-heavyweight-championship");
  }

  // ECW / WCW
  if (has(/\becw\b/)) return file(tag ? "ecw-tag-team-championship" : has(/television|\btv\b/) ? "ecw-world-television-championship" : "ecw-championship");
  if (has(/\bwcw\b/)) return tag ? null : has(/world/) ? file("wcw-world-championship") : null;
  if (has(/crown jewel/)) return null; // no official belt art available; use generated art

  // WWE Women's
  if (womens) {
    if (tag) return file("wwe-womens-tag-team-championship");
    if (has(/intercontinental/)) return file("wwe-womens-intercontinental-championship");
    if (has(/united states|\bus\b/)) return file("wwe-womens-united-states-championship");
    if (has(/smackdown/)) return file("smackdown-womens-championship");
    if (has(/world/)) return file("womens-world-championship");
    return file("wwe-womens-championship");
  }

  // WWE Other / Classic
  if (has(/\bmillion dollar\b/)) return file("million-dollar-championship");
  if (has(/\bspeed\b/)) return file("speed-championship");
  if (has(/\bdivas\b/)) return file("divas-championship");
  if (has(/24\/?7/)) return file("24-7-championship");
  if (has(/hardcore/)) return file("hardcore-championship");
  if (has(/light ?heavyweight/)) return file("light-heavyweight-championship");
  if (has(/cruiserweight/)) return file("cruiserweight-championship");
  if (has(/european/)) return file("european-championship");
  if (has(/intercontinental/)) return file("intercontinental-championship");
  if (has(/united states|\bus\b/)) return file("united-states-championship");
  if (has(/universal/)) return file("universal-championship");
  if (tag) {
    if (has(/\braw\b/)) return file("raw-tag-team-championship");
    if (has(/\bworld\b/)) return file("world-tag-team-championship");
    return file("wwe-tag-team-championship");
  }
  if (has(/world heavyweight/)) return file("world-heavyweight-championship");
  if (has(/^(undisputed )?(wwe|wwf)( undisputed)?( world)? (championship|title)\b/) || has(/\bwwe championship\b/)) return file("wwe-championship");

  return null;
}

// ── Artwork ──────────────────────────────────────────────────────────────────

const METALS: Record<Metal, { light: string; mid: string; dark: string; ink: string }> = {
  gold: { light: "#fff3b8", mid: "#f2c230", dark: "#a8740a", ink: "#4a3000" },
  silver: { light: "#ffffff", mid: "#c9cfd6", dark: "#6c7683", ink: "#222a33" },
  bronze: { light: "#f6d2ae", mid: "#cd7f32", dark: "#74421a", ink: "#3a1f08" },
  rose: { light: "#ffe3e9", mid: "#f2a1b4", dark: "#a8506a", ink: "#4a1426" },
  purple: { light: "#f0defe", mid: "#a855f7", dark: "#5b1d99", ink: "#220a3d" },
};
const STRAPS: Record<Strap, { top: string; bottom: string }> = {
  black: { top: "#26262c", bottom: "#0b0b0e" },
  brown: { top: "#5a3820", bottom: "#2a190c" },
  navy: { top: "#1d2d52", bottom: "#0a1226" },
  red: { top: "#5a1620", bottom: "#240609" },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function fontSizeFor(label: string, plateRx: number): number {
  const isEmoji = /\p{Extended_Pictographic}/u.test(label);
  if (isEmoji) return plateRx * 0.95;
  const len = Array.from(label).length;
  return Math.min(plateRx * 0.62, (plateRx * 1.45) / Math.max(1, len) + 4);
}

/** A 320×120 championship belt as an SVG string. */
export function beltSvg(style: BeltStyle, label: string): string {
  const m = METALS[style.metal];
  const s = STRAPS[style.strap];
  const id = `b${hash(`${style.metal}${style.strap}${style.tag}${label}`)}`;

  const studs = (cx: number, cy: number, rx: number, ry: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="2.6" fill="url(#${id}m)" stroke="${m.dark}" stroke-width=".6"/>`;
    }).join("");

  const plate = (cx: number, rx: number, ry: number, text: string) => `
    <ellipse cx="${cx}" cy="62" rx="${rx}" ry="${ry}" fill="url(#${id}m)" stroke="${m.dark}" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="62" rx="${rx - 8}" ry="${ry - 8}" fill="none" stroke="${m.light}" stroke-opacity=".85" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="62" rx="${rx - 13}" ry="${ry - 13}" fill="url(#${id}i)" stroke="${m.dark}" stroke-width="1"/>
    ${studs(cx, 62, rx - 4, ry - 4, style.tag ? 10 : 14)}
    <text x="${cx}" y="62" text-anchor="middle" dominant-baseline="central" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="${fontSizeFor(text, rx - 13).toFixed(1)}" fill="${m.ink}" fill-opacity=".92">${esc(text)}</text>
    <ellipse cx="${cx - rx * 0.18}" cy="${62 - ry * 0.45}" rx="${rx * 0.55}" ry="${ry * 0.28}" fill="#fff" fill-opacity=".22"/>`;

  const sidePlate = (x: number) => `
    <rect x="${x}" y="40" width="46" height="44" rx="9" fill="url(#${id}m)" stroke="${m.dark}" stroke-width="2"/>
    <rect x="${x + 6}" y="46" width="34" height="32" rx="6" fill="none" stroke="${m.light}" stroke-opacity=".7"/>
    <circle cx="${x + 11}" cy="51" r="2.2" fill="${m.dark}"/><circle cx="${x + 35}" cy="51" r="2.2" fill="${m.dark}"/>
    <circle cx="${x + 11}" cy="73" r="2.2" fill="${m.dark}"/><circle cx="${x + 35}" cy="73" r="2.2" fill="${m.dark}"/>`;

  const centre = style.tag
    ? plate(112, 46, 44, label) + plate(208, 46, 44, label)
    : plate(160, 66, 58, label);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 124" role="img">
  <defs>
    <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.light}"/><stop offset=".45" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.dark}"/>
    </linearGradient>
    <linearGradient id="${id}i" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.light}"/>
    </linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s.top}"/><stop offset="1" stop-color="${s.bottom}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="36" width="316" height="52" rx="12" fill="url(#${id}s)" stroke="#000" stroke-opacity=".5"/>
  <line x1="12" y1="43" x2="308" y2="43" stroke="${m.light}" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="12" y1="81" x2="308" y2="81" stroke="${m.light}" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="5 4"/>
  ${style.tag ? sidePlate(8) + sidePlate(266) : sidePlate(24) + sidePlate(250)}
  ${centre}
</svg>`;
}

export function beltDataUri(style: BeltStyle, label: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(beltSvg(style, label))}`;
}
