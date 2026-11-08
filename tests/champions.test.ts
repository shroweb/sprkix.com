import { describe, it, expect } from "vitest";
import { getAllCurrentChampions, getDaysHeld } from "../lib/champions";

describe("getAllCurrentChampions", () => {
  it("loads all active championships across promotions", () => {
    const champs = getAllCurrentChampions();
    expect(champs.length).toBeGreaterThanOrEqual(30);

    const promos = new Set(champs.map((c) => c.promotion));
    expect(promos.has("WWE")).toBe(true);
    expect(promos.has("AEW")).toBe(true);
    expect(promos.has("NXT")).toBe(true);
    expect(promos.has("TNA")).toBe(true);
    expect(promos.has("NJPW")).toBe(true);
    expect(promos.has("ROH")).toBe(true);
  });

  it("resolves belt photos for major championships", () => {
    const champs = getAllCurrentChampions();
    const wweWorld = champs.find((c) => c.id === "wwe-undisputed");
    expect(wweWorld?.photoUrl).toBe("/belts/wwe-championship.webp");

    const aewWorld = champs.find((c) => c.id === "aew-world");
    expect(aewWorld?.photoUrl).toBe("/belts/aew-world-championship.webp");

    const cjMen = champs.find((c) => c.id === "wwe-crown-jewel");
    expect(cjMen?.photoUrl).toBe("/belts/crown-jewel-championship.webp");

    const cjWomen = champs.find((c) => c.id === "wwe-womens-crown-jewel");
    expect(cjWomen?.photoUrl).toBe("/belts/womens-crown-jewel-championship.webp");
  });

  it("calculates days held accurately", () => {
    const days = getDaysHeld("2024-04-07");
    expect(days).toBeGreaterThan(150);
  });
});
