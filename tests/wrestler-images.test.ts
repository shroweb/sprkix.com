import { describe, it, expect } from "vitest";
import { pickPerson, normalizeName, hasWrestlingCredit, aliasMatches } from "../lib/wrestler-images";

const person = (id: number, name: string, extra: Partial<Parameters<typeof pickPerson>[1][number]> = {}) => ({
  id, name, profile_path: "/x.jpg", popularity: 1, known_for: [], ...extra,
});

describe("normalizeName", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeName("Rey Mysterio Jr.")).toBe("rey mysterio jr");
    expect(normalizeName("José  Álvarez")).toBe("jose alvarez");
  });
});

describe("pickPerson", () => {
  it("requires an exact name match", () => {
    expect(pickPerson("Roman Reigns", [person(1, "Roman Reign"), person(2, "Roman Reigns Jr")])).toBeNull();
  });
  it("skips people without a photo", () => {
    expect(pickPerson("Roman Reigns", [{ ...person(1, "Roman Reigns"), profile_path: null }])).toBeNull();
  });
  it("prefers the match with wrestling credits and marks it confident", () => {
    const r = pickPerson("Sami Zayn", [
      person(1, "Sami Zayn", { popularity: 50 }),
      person(2, "Sami Zayn", { popularity: 5, known_for: [{ name: "WWE Raw" }] }),
    ]);
    expect(r?.person.id).toBe(2);
    expect(r?.confident).toBe(true);
  });
  it("flags an exact name with no wrestling credits as not confident", () => {
    const r = pickPerson("Zaria", [person(1, "Zaria", { known_for: [{ title: "Some Drama" }] })]);
    expect(r?.confident).toBe(false);
  });
});

describe("hasWrestlingCredit", () => {
  it("recognises wrestling credits", () => {
    expect(hasWrestlingCredit("WWE Friday Night SmackDown")).toBe(true);
    expect(hasWrestlingCredit("Kitchen Nightmares")).toBe(false);
  });
});

describe("aliasMatches", () => {
  it("finds a ring name among aliases", () => {
    expect(aliasMatches("Roman Reigns", ["Joe Anoa'i", "Roman Reigns"])).toBe(true);
    expect(aliasMatches("Roman Reigns", ["Joe Anoa'i"])).toBe(false);
    expect(aliasMatches("Roman Reigns", undefined)).toBe(false);
  });
});
