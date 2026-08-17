import { describe, it, expect } from "vitest";
import { computeEligibleBadges } from "../lib/badges";

describe("computeEligibleBadges", () => {
  it("returns no badges for an inactive user", () => {
    expect(
      computeEligibleBadges({ correctPredictions: 0, reviews: 0, isFoundingMember: false }),
    ).toEqual([]);
  });

  it("awards ppv_master at exactly 10 correct predictions", () => {
    expect(
      computeEligibleBadges({ correctPredictions: 10, reviews: 0, isFoundingMember: false }),
    ).toContain("ppv_master");
    expect(
      computeEligibleBadges({ correctPredictions: 9, reviews: 0, isFoundingMember: false }),
    ).not.toContain("ppv_master");
  });

  it("awards top_reviewer at 5 reviews", () => {
    expect(
      computeEligibleBadges({ correctPredictions: 0, reviews: 5, isFoundingMember: false }),
    ).toContain("top_reviewer");
  });

  it("awards founding_member from the flag", () => {
    expect(
      computeEligibleBadges({ correctPredictions: 0, reviews: 0, isFoundingMember: true }),
    ).toContain("founding_member");
  });

  it("can award multiple badges at once", () => {
    const badges = computeEligibleBadges({
      correctPredictions: 20,
      reviews: 8,
      isFoundingMember: true,
    });
    expect(badges).toEqual(["ppv_master", "top_reviewer", "founding_member"]);
  });
});
