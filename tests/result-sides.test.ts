import { describe, it, expect } from "vitest";
import { parseResultSides } from "../lib/result-sides";
import { normName, buildWrestlerMap, findWrestler } from "../lib/wrestler-match";

describe("parseResultSides", () => {
  it("expands team labels into members", () => {
    const r = parseResultSides("The Vision (Austin Theory & Bron Breakker) (c) defeat Alpha Academy (Akira Tozawa & Otis)");
    expect(r?.sides).toEqual([["Austin Theory", "Bron Breakker"], ["Akira Tozawa", "Otis"]]);
    expect(r?.winner).toBe(0);
  });
  it("handles comma lists and manager notes", () => {
    const r = parseResultSides("Bobby Lashley & Shelton Benjamin & Lee Moriarty (w/MVP & Shane Taylor Promotions) defeat Matt Mako, Nic Nolan & Ryan O'Neill (12:30)");
    expect(r?.sides).toEqual([["Bobby Lashley", "Shelton Benjamin", "Lee Moriarty"], ["Matt Mako", "Nic Nolan", "Ryan O'Neill"]]);
  });
  it("splits three teams on vs.", () => {
    const r = parseResultSides("A & B defeat C & D vs. E & F");
    expect(r?.sides).toEqual([["A", "B"], ["C", "D"], ["E", "F"]]);
  });
  it("splits losers on 'and'", () => {
    const r = parseResultSides("A & B defeat C & D and E & F");
    expect(r?.sides).toHaveLength(3);
  });
  it("ignores outcome suffixes and truncated manager notes", () => {
    expect(parseResultSides("The Nemeths (Nic Nemeth & Ryan Nemeth) defeat The Hardys (Jeff Hardy & Matt Hardy) (c)  - TITLE CHANGE !!!")?.sides)
      .toEqual([["Nic Nemeth", "Ryan Nemeth"], ["Jeff Hardy", "Matt Hardy"]]);
    expect(parseResultSides("AR Fox & Lio Rush defeat Action Andretti & Hook by DQ")?.sides[1]).toEqual(["Action Andretti", "Hook"]);
    expect(parseResultSides("CM Punk, Myles Borne & Tavion Heights defeat The Vanity Project (Brad Baylor, Jackson Drake & Ricky Smokes (w/Myka Lockwood)")?.sides[1])
      .toEqual(["Brad Baylor", "Jackson Drake", "Ricky Smokes"]);
    expect(parseResultSides("LA Knight & Solo Sikoa vs. The Usos (Jey Uso & Jimmy Uso) - No Contest")?.sides).toHaveLength(2);
  });
  it("splits multi-team losers joined by 'and' even with groups", () => {
    const r = parseResultSides("Swerve Strickland & The New Level (Austin Creed & Kofi) (w/Prince Nana) defeat Adam Page & Brodido (Bandido & Brody King) (c) and Bang Bang Gang (Austin Gunn, Colten Gunn & Jay White) and Death Riders (Claudio Castagnoli, PAC & Wheeler Yuta) (w/Marina Shafir)");
    expect(r?.sides).toEqual([
      ["Swerve Strickland", "Austin Creed", "Kofi"],
      ["Adam Page", "Bandido", "Brody King"],
      ["Austin Gunn", "Colten Gunn", "Jay White"],
      ["Claudio Castagnoli", "PAC", "Wheeler Yuta"],
    ]);
  });
  it("draws have no winner; plain text returns null", () => {
    expect(parseResultSides("A vs. B (Time Limit Draw)")?.winner).toBeNull();
    expect(parseResultSides("Some random note")).toBeNull();
    expect(parseResultSides(null)).toBeNull();
  });
});

describe("wrestler matching", () => {
  const ws = [
    { id: "1", name: "OZAWA", aliases: [] },
    { id: "2", name: "Ivar", aliases: [] },
    { id: "3", name: "Akira Tozawa", aliases: [{ alias: "Tozawa Akira" }] },
    { id: "4", name: "Tetsuya Naito", aliases: [{ alias: "Naito" }] },
  ];
  const map = buildWrestlerMap(ws);
  it("never matches by substring", () => {
    expect(findWrestler(map, "Ariya Daivari")).toBeUndefined();
    expect(findWrestler(map, "Daivari")).toBeUndefined();
  });
  it("accepts unambiguous whole-word short names only", () => {
    const m = buildWrestlerMap([
      { id: "a", name: "Trent Beretta", aliases: [] },
      { id: "b", name: "Penta El Zero Miedo", aliases: [] },
      { id: "c", name: "Jey Uso", aliases: [] },
      { id: "d", name: "Jimmy Uso", aliases: [] },
    ]);
    expect(findWrestler(m, "Trent")?.id).toBe("a");
    expect(findWrestler(m, "Penta")?.id).toBe("b");
    expect(findWrestler(m, "Uso")).toBeUndefined(); // ambiguous: two Usos
    expect(findWrestler(m, "Tozawa")?.id).toBeUndefined();
  });
  it("matches exact, accents, aliases and word order", () => {
    expect(findWrestler(map, "akira tozawa")?.id).toBe("3");
    expect(findWrestler(map, "Naito")?.id).toBe("4");
    expect(findWrestler(map, "Naito Tetsuya")?.id).toBe("4");
    expect(normName("Jörg O'Neill")).toBe("jorg oneill");
  });
});
