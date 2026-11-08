import { daysBetween } from "./lineal";
import { photoFor, styleForName, type BeltStyle } from "./belts";

export type PromotionCode = "ALL" | "WWE" | "AEW" | "NXT" | "TNA" | "NJPW" | "ROH";

export interface ChampionPerson {
  name: string;
  slug?: string;
  imageUrl?: string | null;
}

export interface ChampionRecord {
  id: string;
  title: string;
  shortName?: string;
  promotion: "WWE" | "AEW" | "NXT" | "TNA" | "NJPW" | "ROH";
  brand?: string;
  champions: ChampionPerson[];
  wonDate: string; // ISO date YYYY-MM-DD
  wonAt: string;
  defenses?: number;
  photoUrl: string | null;
  style: BeltStyle;
}

export const CURRENT_CHAMPIONS: Omit<ChampionRecord, "photoUrl" | "style">[] = [
  // ── WWE ─────────────────────────────────────────────────────────────
  {
    id: "wwe-undisputed",
    title: "Undisputed WWE Championship",
    shortName: "WWE",
    promotion: "WWE",
    brand: "SmackDown",
    champions: [{ name: "Cody Rhodes", slug: "cody-rhodes" }],
    wonDate: "2024-04-07",
    wonAt: "WrestleMania XL (Night 2)",
    defenses: 9,
  },
  {
    id: "wwe-world-heavyweight",
    title: "World Heavyweight Championship",
    shortName: "WHC",
    promotion: "WWE",
    brand: "Raw",
    champions: [{ name: "Gunther", slug: "gunther" }],
    wonDate: "2024-08-03",
    wonAt: "SummerSlam 2024",
    defenses: 5,
  },
  {
    id: "wwe-womens-world",
    title: "Women's World Championship",
    shortName: "WWC",
    promotion: "WWE",
    brand: "Raw",
    champions: [{ name: "Liv Morgan", slug: "liv-morgan" }],
    wonDate: "2024-05-25",
    wonAt: "King & Queen of the Ring 2024",
    defenses: 6,
  },
  {
    id: "wwe-womens",
    title: "WWE Women's Championship",
    shortName: "WWEW",
    promotion: "WWE",
    brand: "SmackDown",
    champions: [{ name: "Nia Jax", slug: "nia-jax" }],
    wonDate: "2024-08-03",
    wonAt: "SummerSlam 2024",
    defenses: 4,
  },
  {
    id: "wwe-intercontinental",
    title: "WWE Intercontinental Championship",
    shortName: "IC",
    promotion: "WWE",
    brand: "Raw",
    champions: [{ name: "Bron Breakker", slug: "bron-breakker" }],
    wonDate: "2024-10-21",
    wonAt: "WWE Raw",
    defenses: 2,
  },
  {
    id: "wwe-united-states",
    title: "WWE United States Championship",
    shortName: "US",
    promotion: "WWE",
    brand: "SmackDown",
    champions: [{ name: "LA Knight", slug: "la-knight" }],
    wonDate: "2024-08-03",
    wonAt: "SummerSlam 2024",
    defenses: 5,
  },
  {
    id: "wwe-world-tag-team",
    title: "World Tag Team Championship",
    shortName: "RAW TAG",
    promotion: "WWE",
    brand: "Raw",
    champions: [
      { name: "Finn Bálor", slug: "finn-balor" },
      { name: "JD McDonagh", slug: "jd-mcdonagh" },
    ],
    wonDate: "2024-06-24",
    wonAt: "WWE Raw",
    defenses: 3,
  },
  {
    id: "wwe-tag-team",
    title: "WWE Tag Team Championship",
    shortName: "SD TAG",
    promotion: "WWE",
    brand: "SmackDown",
    champions: [
      { name: "Alex Shelley", slug: "alex-shelley" },
      { name: "Chris Sabin", slug: "chris-sabin" },
    ],
    wonDate: "2024-10-25",
    wonAt: "WWE SmackDown",
    defenses: 1,
  },
  {
    id: "wwe-womens-tag-team",
    title: "WWE Women's Tag Team Championship",
    shortName: "W-TAG",
    promotion: "WWE",
    brand: "Cross-Brand",
    champions: [
      { name: "Bianca Belair", slug: "bianca-belair" },
      { name: "Jade Cargill", slug: "jade-cargill" },
    ],
    wonDate: "2024-08-31",
    wonAt: "Bash in Berlin 2024",
    defenses: 4,
  },
  {
    id: "wwe-speed",
    title: "WWE Speed Championship",
    shortName: "SPEED",
    promotion: "WWE",
    brand: "Speed",
    champions: [{ name: "Dragon Lee", slug: "dragon-lee" }],
    wonDate: "2024-11-15",
    wonAt: "WWE Speed",
    defenses: 1,
  },
  {
    id: "wwe-crown-jewel",
    title: "WWE Crown Jewel Championship",
    shortName: "CJ",
    promotion: "WWE",
    brand: "Annual PLE",
    champions: [{ name: "Cody Rhodes", slug: "cody-rhodes" }],
    wonDate: "2024-11-02",
    wonAt: "Crown Jewel 2024",
    defenses: 0,
  },
  {
    id: "wwe-womens-crown-jewel",
    title: "WWE Women's Crown Jewel Championship",
    shortName: "W-CJ",
    promotion: "WWE",
    brand: "Annual PLE",
    champions: [{ name: "Liv Morgan", slug: "liv-morgan" }],
    wonDate: "2024-11-02",
    wonAt: "Crown Jewel 2024",
    defenses: 0,
  },

  // ── AEW ─────────────────────────────────────────────────────────────
  {
    id: "aew-world",
    title: "AEW World Championship",
    shortName: "AEW",
    promotion: "AEW",
    champions: [{ name: "Jon Moxley", slug: "jon-moxley" }],
    wonDate: "2024-10-12",
    wonAt: "AEW WrestleDream 2024",
    defenses: 2,
  },
  {
    id: "aew-womens-world",
    title: "AEW Women's World Championship",
    shortName: "AEW-W",
    promotion: "AEW",
    champions: [{ name: "Mariah May", slug: "mariah-may" }],
    wonDate: "2024-08-25",
    wonAt: "AEW All In: London 2024",
    defenses: 3,
  },
  {
    id: "aew-tnt",
    title: "AEW TNT Championship",
    shortName: "TNT",
    promotion: "AEW",
    champions: [{ name: "Jack Perry", slug: "jack-perry" }],
    wonDate: "2024-06-30",
    wonAt: "Forbidden Door 2024",
    defenses: 6,
  },
  {
    id: "aew-tbs",
    title: "AEW TBS Championship",
    shortName: "TBS",
    promotion: "AEW",
    champions: [{ name: "Mercedes Moné", slug: "mercedes-mone" }],
    wonDate: "2024-05-26",
    wonAt: "Double or Nothing 2024",
    defenses: 7,
  },
  {
    id: "aew-international",
    title: "AEW International Championship",
    shortName: "INTL",
    promotion: "AEW",
    champions: [{ name: "Konosuke Takeshita", slug: "konosuke-takeshita" }],
    wonDate: "2024-10-12",
    wonAt: "AEW WrestleDream 2024",
    defenses: 3,
  },
  {
    id: "aew-continental",
    title: "AEW Continental Championship",
    shortName: "CONT",
    promotion: "AEW",
    champions: [{ name: "Kazuchika Okada", slug: "kazuchika-okada" }],
    wonDate: "2024-03-20",
    wonAt: "AEW Dynamite",
    defenses: 6,
  },
  {
    id: "aew-tag-team",
    title: "AEW World Tag Team Championship",
    shortName: "AEW TAG",
    promotion: "AEW",
    champions: [
      { name: "Isiah Kassidy", slug: "isiah-kassidy" },
      { name: "Marq Quen", slug: "marq-quen" },
    ],
    wonDate: "2024-10-30",
    wonAt: "AEW Dynamite Fright Night",
    defenses: 1,
  },
  {
    id: "aew-world-trios",
    title: "AEW World Trios Championship",
    shortName: "TRIOS",
    promotion: "AEW",
    champions: [
      { name: "Claudio Castagnoli", slug: "claudio-castagnoli" },
      { name: "PAC", slug: "pac" },
      { name: "Wheeler Yuta", slug: "wheeler-yuta" },
    ],
    wonDate: "2024-08-25",
    wonAt: "AEW All In: London 2024",
    defenses: 3,
  },

  // ── NXT ─────────────────────────────────────────────────────────────
  {
    id: "nxt-championship",
    title: "NXT Championship",
    shortName: "NXT",
    promotion: "NXT",
    champions: [{ name: "Trick Williams", slug: "trick-williams" }],
    wonDate: "2024-10-01",
    wonAt: "NXT on The CW Premiere",
    defenses: 2,
  },
  {
    id: "nxt-womens-championship",
    title: "NXT Women's Championship",
    shortName: "NXT-W",
    promotion: "NXT",
    champions: [{ name: "Roxanne Perez", slug: "roxanne-perez" }],
    wonDate: "2024-04-06",
    wonAt: "NXT Stand & Deliver 2024",
    defenses: 8,
  },
  {
    id: "nxt-north-american",
    title: "NXT North American Championship",
    shortName: "NA",
    promotion: "NXT",
    champions: [{ name: "Tony D'Angelo", slug: "tony-d-angelo" }],
    wonDate: "2024-10-08",
    wonAt: "NXT",
    defenses: 2,
  },
  {
    id: "nxt-womens-north-american",
    title: "NXT Women's North American Championship",
    shortName: "W-NA",
    promotion: "NXT",
    champions: [{ name: "Fallon Henley", slug: "fallon-henley" }],
    wonDate: "2024-10-27",
    wonAt: "NXT Halloween Havoc 2024",
    defenses: 1,
  },
  {
    id: "nxt-tag-team",
    title: "NXT Tag Team Championship",
    shortName: "NXT TAG",
    promotion: "NXT",
    champions: [
      { name: "Nathan Frazer", slug: "nathan-frazer" },
      { name: "Axiom", slug: "axiom" },
    ],
    wonDate: "2024-09-01",
    wonAt: "NXT No Mercy 2024",
    defenses: 3,
  },
  {
    id: "nxt-heritage-cup",
    title: "NXT Heritage Cup",
    shortName: "CUP",
    promotion: "NXT",
    champions: [{ name: "Charlie Dempsey", slug: "charlie-dempsey" }],
    wonDate: "2024-08-13",
    wonAt: "NXT",
    defenses: 3,
  },

  // ── TNA ─────────────────────────────────────────────────────────────
  {
    id: "tna-world",
    title: "TNA World Championship",
    shortName: "TNA",
    promotion: "TNA",
    champions: [{ name: "Nic Nemeth", slug: "nic-nemeth" }],
    wonDate: "2024-07-20",
    wonAt: "TNA Slammiversary 2024",
    defenses: 4,
  },
  {
    id: "tna-knockouts-world",
    title: "TNA Knockouts World Championship",
    shortName: "KO",
    promotion: "TNA",
    champions: [{ name: "Masha Slamovich", slug: "masha-slamovich" }],
    wonDate: "2024-10-26",
    wonAt: "TNA Bound for Glory 2024",
    defenses: 1,
  },
  {
    id: "tna-x-division",
    title: "TNA X-Division Championship",
    shortName: "X-DIV",
    promotion: "TNA",
    champions: [{ name: "Moose", slug: "moose" }],
    wonDate: "2024-10-26",
    wonAt: "TNA Bound for Glory 2024",
    defenses: 2,
  },
  {
    id: "tna-world-tag-team",
    title: "TNA World Tag Team Championship",
    shortName: "TNA TAG",
    promotion: "TNA",
    champions: [
      { name: "Matt Hardy", slug: "matt-hardy" },
      { name: "Jeff Hardy", slug: "jeff-hardy" },
    ],
    wonDate: "2024-10-26",
    wonAt: "TNA Bound for Glory 2024",
    defenses: 1,
  },

  // ── NJPW ────────────────────────────────────────────────────────────
  {
    id: "njpw-iwgp-world",
    title: "IWGP World Heavyweight Championship",
    shortName: "IWGP",
    promotion: "NJPW",
    champions: [{ name: "Zack Sabre Jr.", slug: "zack-sabre-jr" }],
    wonDate: "2024-10-14",
    wonAt: "King of Pro-Wrestling 2024",
    defenses: 2,
  },
  {
    id: "njpw-iwgp-global",
    title: "IWGP Global Heavyweight Championship",
    shortName: "GLOBAL",
    promotion: "NJPW",
    champions: [{ name: "David Finlay", slug: "david-finlay" }],
    wonDate: "2024-05-04",
    wonAt: "Wrestling Dontaku 2024",
    defenses: 3,
  },
  {
    id: "njpw-iwgp-junior",
    title: "IWGP Junior Heavyweight Championship",
    shortName: "JR",
    promotion: "NJPW",
    champions: [{ name: "DOUKI", slug: "douki" }],
    wonDate: "2024-07-05",
    wonAt: "New Japan Soul 2024",
    defenses: 2,
  },
  {
    id: "njpw-iwgp-tag",
    title: "IWGP Tag Team Championship",
    shortName: "IWGP TAG",
    promotion: "NJPW",
    champions: [
      { name: "Mikey Nicholls", slug: "mikey-nicholls" },
      { name: "Shane Haste", slug: "shane-haste" },
    ],
    wonDate: "2024-10-14",
    wonAt: "King of Pro-Wrestling 2024",
    defenses: 1,
  },

  // ── ROH ─────────────────────────────────────────────────────────────
  {
    id: "roh-world",
    title: "ROH World Championship",
    shortName: "ROH",
    promotion: "ROH",
    champions: [{ name: "Chris Jericho", slug: "jericho" }],
    wonDate: "2024-10-23",
    wonAt: "AEW Dynamite",
    defenses: 1,
  },
  {
    id: "roh-womens-world",
    title: "ROH Women's World Championship",
    shortName: "ROH-W",
    promotion: "ROH",
    champions: [{ name: "Athena", slug: "athena" }],
    wonDate: "2022-12-10",
    wonAt: "ROH Final Battle 2022",
    defenses: 18,
  },
  {
    id: "roh-television",
    title: "ROH World Television Championship",
    shortName: "ROH TV",
    promotion: "ROH",
    champions: [{ name: "Brian Cage", slug: "brian-cage" }],
    wonDate: "2024-10-12",
    wonAt: "AEW WrestleDream 2024",
    defenses: 2,
  },
  {
    id: "roh-pure",
    title: "ROH Pure Championship",
    shortName: "PURE",
    promotion: "ROH",
    champions: [{ name: "Lee Moriarty", slug: "lee-moriarty" }],
    wonDate: "2024-07-26",
    wonAt: "ROH Death Before Dishonor 2024",
    defenses: 3,
  },
  {
    id: "roh-tag-team",
    title: "ROH World Tag Team Championship",
    shortName: "ROH TAG",
    promotion: "ROH",
    champions: [
      { name: "Dustin Rhodes", slug: "dustin-rhodes" },
      { name: "Sammy Guevara", slug: "sammy-guevara" },
    ],
    wonDate: "2024-08-17",
    wonAt: "AEW Collision",
    defenses: 3,
  },
];

export function getFullChampionRecord(raw: (typeof CURRENT_CHAMPIONS)[number]): ChampionRecord {
  return {
    ...raw,
    photoUrl: photoFor(raw.title),
    style: styleForName(raw.title),
  };
}

export function getAllCurrentChampions(): ChampionRecord[] {
  return CURRENT_CHAMPIONS.map(getFullChampionRecord);
}

export function getDaysHeld(wonDateIso: string): number {
  return daysBetween(new Date(wonDateIso), new Date());
}
