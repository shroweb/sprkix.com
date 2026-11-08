import { describe, it, expect } from "vitest";
import { parsePeriod, periodStart, rankPredictors } from "../lib/leaderboard";

const d = (day: number) => new Date(Date.UTC(2026, 9, day));
const pick = (userId: string, isCorrect: boolean, day: number) => ({ userId, isCorrect, eventDate: d(day) });

describe("parsePeriod", () => {
  it("defaults to all", () => {
    expect(parsePeriod(undefined)).toBe("all");
    expect(parsePeriod("bogus")).toBe("all");
  });
  it("accepts month and season", () => {
    expect(parsePeriod("month")).toBe("month");
    expect(parsePeriod(["season"])).toBe("season");
  });
});

describe("periodStart", () => {
  const now = new Date(Date.UTC(2026, 9, 9));
  it("returns first of month / year in UTC", () => {
    expect(periodStart("month", now)?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(periodStart("season", now)?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(periodStart("all", now)).toBeNull();
  });
});

describe("rankPredictors", () => {
  it("drops users below the minimum", () => {
    expect(rankPredictors([pick("a", true, 1), pick("a", true, 2)])).toEqual([]);
  });

  it("ranks by accuracy then volume", () => {
    const rows = rankPredictors([
      ...[1, 2, 3].map((i) => pick("a", true, i)),
      ...[1, 2, 3, 4].map((i) => pick("b", true, i)),
      ...[1, 2, 3].map((i) => pick("c", i === 1, i)),
    ]);
    expect(rows.map((r) => r.userId)).toEqual(["b", "a", "c"]);
    expect(rows[2].accuracy).toBe(33);
  });

  it("computes streak from most recent event, not input order", () => {
    const [row] = rankPredictors([
      pick("a", true, 5),
      pick("a", true, 4),
      pick("a", false, 3),
      pick("a", true, 1),
    ]);
    expect(row.streak).toBe(2);
    expect(row.correct).toBe(3);
  });
});
