import { describe, it, expect } from "vitest";
import { streaks } from "../app/components/TrophyCase";

const d = (n: number) => new Date(2026, 0, n);
describe("streaks", () => {
  it("tracks current and best", () => {
    const r = streaks([
      { correct: true, date: d(1) }, { correct: true, date: d(2) }, { correct: true, date: d(3) },
      { correct: false, date: d(4) }, { correct: true, date: d(5) }, { correct: true, date: d(6) },
    ]);
    expect(r).toEqual({ current: 2, best: 3 });
  });
  it("orders by date, not input order", () => {
    expect(streaks([{ correct: false, date: d(9) }, { correct: true, date: d(1) }]).current).toBe(0);
  });
  it("handles empty", () => {
    expect(streaks([])).toEqual({ current: 0, best: 0 });
  });
});
