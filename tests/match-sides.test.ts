import { describe, it, expect } from "vitest";
import { groupSides, inferTeams, cardPosition } from "../lib/match-sides";
import { summarize } from "../lib/recap";

const w = (id: string, team?: number | null, isWinner?: boolean) => ({ team, isWinner, wrestler: { id, name: id } });

describe("match sides", () => {
  it("groups by team number", () => {
    const sides = groupSides([w("a", 1, true), w("b", 1, true), w("c", 2, false), w("d", 2, false)]);
    expect(sides).toHaveLength(2);
    expect(sides[0].members.map((m) => m.wrestler.id)).toEqual(["a", "b"]);
    expect(sides[0].isWinner).toBe(true);
    expect(sides[1].isWinner).toBe(false);
  });
  it("treats everyone as their own side without teams", () => {
    expect(groupSides([w("a"), w("b"), w("c")])).toHaveLength(3);
  });
  it("infers halves for tag matches without teams", () => {
    const out = inferTeams([w("a"), w("b"), w("c"), w("d")], "Tag Team Match", "x");
    expect(out.map((p) => p.team)).toEqual([1, 1, 2, 2]);
  });
  it("does not infer for singles or odd fields", () => {
    expect(inferTeams([w("a"), w("b")], "Singles Match", "x").map((p) => p.team)).toEqual([undefined, undefined]);
    expect(inferTeams([w("a"), w("b"), w("c")], "Tag Team Match", "x").map((p) => p.team)).toEqual([undefined, undefined, undefined]);
  });
  it("labels card positions", () => {
    expect(cardPosition(4, 5)).toBe("main");
    expect(cardPosition(3, 5)).toBe("co-main");
    expect(cardPosition(0, 5)).toBe("undercard");
    expect(cardPosition(0, 1)).toBe("undercard");
  });
});

describe("recap summarize", () => {
  const pick = (correct: boolean, communityPct: number) => ({ matchId: "m", title: "t", picked: "p", correct, communityPct });
  it("finds best call and worst miss", () => {
    const s = summarize([pick(true, 80), pick(true, 12), pick(false, 90), pick(false, 30)]);
    expect(s.correct).toBe(2);
    expect(s.bestCall?.communityPct).toBe(12);
    expect(s.worstMiss?.communityPct).toBe(90);
    expect(s.perfect).toBe(false);
  });
  it("flags perfect cards only with 3+ picks", () => {
    expect(summarize([pick(true, 50), pick(true, 50)]).perfect).toBe(false);
    expect(summarize([pick(true, 50), pick(true, 50), pick(true, 50)]).perfect).toBe(true);
  });
});
