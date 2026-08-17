import { describe, it, expect } from "vitest";
import { slugify } from "../lib/slug-utils";

describe("slugify", () => {
  it("lowercases and replaces non-alphanumerics with hyphens", () => {
    expect(slugify("WWE WrestleMania XL")).toBe("wwe-wrestlemania-xl");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugify("  – AEW All In –  ")).toBe("aew-all-in");
  });

  it("collapses runs of separators", () => {
    expect(slugify("NJPW!!  Wrestle Kingdom---18")).toBe("njpw-wrestle-kingdom-18");
  });
});
