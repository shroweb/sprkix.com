import { describe, it, expect } from "vitest";
import { safeNextPath } from "../lib/auth-redirect";

describe("safeNextPath", () => {
  it("accepts same-site paths with query strings", () => {
    expect(safeNextPath("/events/wrestlemania?tab=predictions")).toBe("/events/wrestlemania?tab=predictions");
    expect(safeNextPath(encodeURIComponent("/events/x"))).toBe("/events/x");
  });
  it("falls back for missing or external targets", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath("events")).toBe("/");
    expect(safeNextPath("/%0d%0aSet-Cookie:x")).toBe("/");
  });
});
