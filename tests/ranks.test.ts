import { describe, it, expect } from "vitest";
import { calcRankScore, getRank, RANKS } from "../lib/ranks";

describe("calcRankScore", () => {
  it("weights each activity type", () => {
    expect(calcRankScore(10, 5, 20, 2)).toBe(10 * 1 + 5 * 3 + 20 * 1 + 2 * 5);
  });

  it("defaults submissions to zero", () => {
    expect(calcRankScore(0, 0, 0)).toBe(0);
  });
});

describe("getRank", () => {
  it("returns the rank matching the score band", () => {
    expect(getRank(0).name).toBe("Local Talent");
    expect(getRank(10).name).toBe("Jobber");
    expect(getRank(50).name).toBe("Mid-Carder");
    expect(getRank(200).name).toBe("Champion");
    expect(getRank(650).name).toBe("Hall of Famer");
  });

  it("has ordered, non-overlapping bands", () => {
    for (let i = 0; i < RANKS.length - 1; i++) {
      expect(RANKS[i].max).toBeLessThan(RANKS[i + 1].min);
    }
  });
});
