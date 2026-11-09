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
    // Flip a character in the middle of the signature. The final base64url char only carries
    // partial bits, so changing it can still decode to the same bytes (a flaky false pass).
    const i = token.length - 10;
    const tampered = token.slice(0, i) + (token[i] === "a" ? "b" : "a") + token.slice(i + 1);
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
