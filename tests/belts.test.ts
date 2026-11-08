import { describe, it, expect } from "vitest";
import { parseChampionship, beltSvg, photoFor } from "../lib/belts";

describe("parseChampionship", () => {
  it("reads title matches and tidies spacing", () => {
    const c = parseChampionship("WWE World Heavyweight  Title Match");
    expect(c?.name).toBe("WWE World Heavyweight Championship");
    expect(c?.label).toBe("WWE");
    expect(c?.style.metal).toBe("gold");
  });
  it("ignores non-title matches and stipulation-only names", () => {
    expect(parseChampionship("Non Title Match")).toBeNull();
    expect(parseChampionship("Singles Match")).toBeNull();
    expect(parseChampionship("Triple Threat Title Match")).toBeNull();
    expect(parseChampionship(null, undefined)).toBeNull();
  });
  it("detects tag, women's, midcard and special belts", () => {
    expect(parseChampionship("WWE World Tag Team  Title Match")?.style.tag).toBe(true);
    expect(parseChampionship("WWE Women's  Title Match")?.style.metal).toBe("rose");
    expect(parseChampionship("WWE Intercontinental Title Match")?.style.metal).toBe("silver");
    expect(parseChampionship("WWE Crown Jewel 2026 Title Match")?.style.metal).toBe("purple");
    expect(parseChampionship("AEW TNT Championship Match")?.style.metal).toBe("silver");
  });
  it("falls back to the first candidate that is a title", () => {
    expect(parseChampionship("Singles Match", "AEW World Championship")?.label).toBe("AEW");
  });
});

describe("beltSvg", () => {
  it("renders valid-looking SVG and escapes labels", () => {
    const svg = beltSvg({ metal: "gold", strap: "black", tag: false }, "<WWE>");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("&lt;WWE&gt;");
    expect(svg).not.toContain("<WWE>");
  });
});

describe("photoFor", () => {
  it("maps WWE-family titles to belt photos", () => {
    expect(photoFor("WWE World Heavyweight Championship")).toBe("/belts/world-heavyweight-championship.webp");
    expect(photoFor("WWE Intercontinental Title")).toBe("/belts/intercontinental-championship.webp");
    expect(photoFor("WWE Women's Tag Team Championship")).toBe("/belts/wwe-womens-tag-team-championship.webp");
    expect(photoFor("Women's World Championship")).toBe("/belts/womens-world-championship.webp");
    expect(photoFor("WWE Women's Championship")).toBe("/belts/wwe-womens-championship.webp");
    expect(photoFor("NXT Championship")).toBe("/belts/nxt-championship.webp");
    expect(photoFor("NXT North American Championship")).toBe("/belts/nxt-north-american-championship.webp");
    expect(photoFor("NXT Women's North American Championship")).toBe("/belts/nxt-womens-north-american-championship.webp");
    expect(photoFor("WCW World Heavyweight Title")).toBe("/belts/wcw-world-championship.webp");
    expect(photoFor("WWE World Tag Team Title")).toBe("/belts/world-tag-team-championship.webp");
    expect(photoFor("WWE Raw Tag Team Title")).toBe("/belts/raw-tag-team-championship.webp");
    expect(photoFor("WWE Tag Team Title")).toBe("/belts/wwe-tag-team-championship.webp");
    expect(photoFor("WWE Speed Championship")).toBe("/belts/speed-championship.webp");
    expect(photoFor("Million Dollar Championship")).toBe("/belts/million-dollar-championship.webp");
    expect(photoFor("WWE Women's Crown Jewel 2026 Title")).toBe("/belts/womens-crown-jewel-championship.webp");
    expect(photoFor("WWE Crown Jewel Championship")).toBe("/belts/crown-jewel-championship.webp");
    expect(photoFor("WWE Championship")).toBe("/belts/wwe-championship.webp");
  });

  it("maps AEW, TNA, ROH and NJPW titles to belt photos", () => {
    expect(photoFor("AEW World Championship")).toBe("/belts/aew-world-championship.webp");
    expect(photoFor("Real World Championship")).toBe("/belts/aew-world-championship.webp");
    expect(photoFor("AEW TNT Championship")).toBe("/belts/aew-tnt-championship.webp");
    expect(photoFor("AEW TBS Championship")).toBe("/belts/aew-tbs-championship.webp");
    expect(photoFor("AEW International Championship")).toBe("/belts/aew-international-championship.webp");
    expect(photoFor("AEW Continental Championship")).toBe("/belts/aew-continental-championship.webp");
    expect(photoFor("AEW World Tag Team Championship")).toBe("/belts/aew-tag-team-championship.webp");
    expect(photoFor("AEW World Trios Championship")).toBe("/belts/aew-world-trios-championship.webp");

    expect(photoFor("TNA World Championship")).toBe("/belts/tna-world-championship.webp");
    expect(photoFor("TNA X-Division Championship")).toBe("/belts/tna-x-division-championship.webp");
    expect(photoFor("TNA Knockouts World Championship")).toBe("/belts/tna-knockouts-world-championship.webp");
    expect(photoFor("TNA World Tag Team Championship")).toBe("/belts/tna-world-tag-team-championship.webp");
    expect(photoFor("TNA Digital Media Championship")).toBe("/belts/tna-digital-media-championship.webp");
    expect(photoFor("TNA Knockouts World Tag Team Championship")).toBe("/belts/tna-knockouts-world-tag-team-championship.webp");

    expect(photoFor("ROH World Championship")).toBe("/belts/roh-world-championship.webp");
    expect(photoFor("ROH Women's World Championship")).toBe("/belts/roh-womens-world-championship.webp");
    expect(photoFor("ROH World Television Championship")).toBe("/belts/roh-television-championship.webp");
    expect(photoFor("ROH Women's World Television Championship")).toBe("/belts/roh-womens-television-championship.webp");
    expect(photoFor("ROH Pure Championship")).toBe("/belts/roh-pure-championship.webp");
    expect(photoFor("ROH Women's Pure Championship")).toBe("/belts/roh-womens-pure-championship.webp");
    expect(photoFor("ROH World Six-Man Tag Team Championship")).toBe("/belts/roh-six-man-tag-team-championship.webp");
    expect(photoFor("ROH World Tag Team Championship")).toBe("/belts/roh-tag-team-championship.webp");

    expect(photoFor("IWGP World Heavyweight Championship")).toBe("/belts/iwgp-world-heavyweight-championship.webp");
    expect(photoFor("IWGP Heavyweight Championship")).toBe("/belts/iwgp-heavyweight-championship.webp");
    expect(photoFor("IWGP Junior Heavyweight Championship")).toBe("/belts/iwgp-junior-heavyweight-championship.webp");
  });

  it("maps newly added belts and returns null for novelty prizes and unknown titles", () => {
    expect(photoFor("Custody of Dominik Mysterio")).toBeNull();
    expect(photoFor("AEW National Title Match")).toBe("/belts/aew-national-championship.webp");
    expect(photoFor("TNA International Title")).toBe("/belts/tna-international-championship.webp");
    expect(photoFor("Random Unknown Nonexistent Championship")).toBeNull();
  });
});
