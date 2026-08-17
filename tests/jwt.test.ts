import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken } from "../lib/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "unit-test-secret";
});

describe("jwt helpers", () => {
  it("round-trips a payload", async () => {
    const token = await signToken({ userId: "user_123" }, "1h");
    const payload = await verifyToken<{ userId: string }>(token);
    expect(payload?.userId).toBe("user_123");
  });

  it("rejects a tampered token", async () => {
    const token = await signToken({ userId: "user_123" }, "1h");
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(await verifyToken(tampered)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifyToken("definitely-not-a-jwt")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signToken({ userId: "user_123" }, "1h");
    process.env.JWT_SECRET = "a-different-secret";
    expect(await verifyToken(token)).toBeNull();
    process.env.JWT_SECRET = "unit-test-secret";
  });
});
