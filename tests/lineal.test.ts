import { describe, it, expect } from "vitest";
import { judgeMatch, computeReigns, DEFAULT_RULES, type EngineMatch, type TimedMatch } from "../lib/lineal";

const P = (wrestlerId: string, team: number | null, isWinner: boolean | null) => ({ wrestlerId, team, isWinner });
const single = (id: string, a: string, b: string, winner: "a" | "b", extra: Partial<EngineMatch> = {}): EngineMatch => ({
  id,
  type: "Singles Match",
  result: `${winner === "a" ? a : b} defeats ${winner === "a" ? b : a}`,
  participants: [P(a, 1, winner === "a"), P(b, 2, winner === "b")],
  ...extra,
});
const at = (day: number) => new Date(Date.UTC(2026, 10, day));
const timed = (m: EngineMatch, day: number): TimedMatch => ({ ...m, at: at(day) });

describe("judgeMatch", () => {
  it("ignores matches the holder isn't in", () => {
    expect(judgeMatch("x", single("m1", "a", "b", "a"), DEFAULT_RULES)).toEqual({ kind: "skip" });
  });
  it("counts a defence when the holder wins", () => {
    expect(judgeMatch("a", single("m1", "a", "b", "a"), DEFAULT_RULES)).toEqual({ kind: "defence" });
  });
  it("passes the title to whoever beats the holder", () => {
    expect(judgeMatch("a", single("m1", "a", "b", "b"), DEFAULT_RULES)).toEqual({ kind: "change", winnerId: "b" });
  });
  it("ignores tag matches", () => {
    const tag: EngineMatch = {
      id: "t", type: "Tag Team Match", result: "A & C defeat B & D",
      participants: [P("a", 1, true), P("c", 1, true), P("b", 2, false), P("d", 2, false)],
    };
    expect(judgeMatch("b", tag, DEFAULT_RULES)).toEqual({ kind: "skip" });
  });
  it("ignores battle royals and rumbles", () => {
    const br: EngineMatch = {
      id: "br", type: "Battle Royal", result: "A wins",
      participants: [P("a", null, true), P("b", null, false), P("c", null, false)],
    };
    expect(judgeMatch("b", br, DEFAULT_RULES)).toEqual({ kind: "skip" });
  });
  it("ignores DQ and count-out finishes when clean finishes are required", () => {
    expect(judgeMatch("a", single("m", "a", "b", "b", { result: "B defeats A (DQ)" }), DEFAULT_RULES)).toEqual({ kind: "skip" });
    expect(judgeMatch("a", single("m", "a", "b", "b", { result: "B defeats A (Count Out)" }), DEFAULT_RULES)).toEqual({ kind: "skip" });
    expect(judgeMatch("a", single("m", "a", "b", "b", { result: "B defeats A (DQ)" }), { ...DEFAULT_RULES, requireClean: false })).toEqual({ kind: "change", winnerId: "b" });
  });
  it("ignores matches with no winner", () => {
    const m: EngineMatch = { id: "d", type: "Singles Match", result: null, participants: [P("a", 1, null), P("b", 2, null)] };
    expect(judgeMatch("a", m, DEFAULT_RULES)).toEqual({ kind: "skip" });
  });
  it("sends multi-man losses to review by default, and changes the title when allowed", () => {
    const three: EngineMatch = {
      id: "3w", type: "Three Way Match", result: "B defeats A and C",
      participants: [P("a", 1, false), P("b", 2, true), P("c", 3, false)],
    };
    expect(judgeMatch("a", three, DEFAULT_RULES).kind).toBe("review");
    expect(judgeMatch("a", three, { ...DEFAULT_RULES, allowMultiMan: true })).toEqual({ kind: "change", winnerId: "b" });
    expect(judgeMatch("b", three, DEFAULT_RULES)).toEqual({ kind: "defence" });
  });
});

describe("computeReigns", () => {
  it("tracks defences, changes and reign numbers from a seed", () => {
    const { reigns, reviews } = computeReigns(
      { wrestlerId: "roman", startedAt: at(7), startMatchId: "seed" },
      [
        timed(single("m1", "roman", "x", "a"), 8),
        timed(single("m2", "roman", "y", "b"), 9),
        timed(single("m3", "y", "roman", "b"), 10),
        timed(single("m4", "roman", "z", "a"), 11),
      ],
    );
    expect(reviews).toEqual([]);
    expect(reigns.map((r) => [r.wrestlerId, r.reignNumber, r.defences])).toEqual([
      ["roman", 1, 1],
      ["y", 1, 0],
      ["roman", 2, 1],
    ]);
    expect(reigns[0].endedAt).toEqual(at(9));
    expect(reigns[0].endMatchId).toBe("m2");
    expect(reigns[2].endedAt).toBeNull();
    expect(reigns[1].source).toBe("auto");
  });

  it("does not change hands for matches the holder isn't in", () => {
    const { reigns } = computeReigns({ wrestlerId: "roman", startedAt: at(7) }, [timed(single("m", "x", "y", "a"), 8)]);
    expect(reigns).toHaveLength(1);
  });

  it("collects ambiguous multi-man losses for review without moving the title", () => {
    const three: EngineMatch = {
      id: "3w", type: "Triple Threat Match", result: "B defeats A and C",
      participants: [P("roman", 1, false), P("b", 2, true), P("c", 3, false)],
    };
    const { reigns, reviews } = computeReigns({ wrestlerId: "roman", startedAt: at(7) }, [timed(three, 8)]);
    expect(reigns).toHaveLength(1);
    expect(reviews.map((r) => r.matchId)).toEqual(["3w"]);
  });

  it("respects a seed reign number", () => {
    const { reigns } = computeReigns(
      { wrestlerId: "a", startedAt: at(1), reignNumber: 3 },
      [timed(single("m1", "a", "b", "b"), 2), timed(single("m2", "b", "a", "b"), 3)],
    );
    expect(reigns.map((r) => [r.wrestlerId, r.reignNumber])).toEqual([["a", 3], ["b", 1], ["a", 4]]);
  });
});
