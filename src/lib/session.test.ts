// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "./session";

describe("session", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-key-for-unit-tests";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it("exposes the cookie name used across the app", () => {
    expect(SESSION_COOKIE_NAME).toBe("a2_session");
  });

  it("round-trips a payload through createSessionToken/verifySessionToken", async () => {
    const token = await createSessionToken({ staffId: "s1" });
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual({ staffId: "s1" });
  });

  it("verifySessionToken returns null for a malformed token", async () => {
    expect(await verifySessionToken("not-a-real-jwt")).toBeNull();
  });

  it("verifySessionToken returns null for a token signed with a different secret", async () => {
    const token = await createSessionToken({ staffId: "s1" });
    process.env.SESSION_SECRET = "a-different-secret-key-for-tests";
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("verifySessionToken returns null when the payload's staffId isn't a string", async () => {
    // Simulate a token whose payload was tampered with / never had a
    // staffId claim, without needing to forge a signature ourselves: sign a
    // payload directly with jose using the same secret and shape it wrong.
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const token = await new SignJWT({ staffId: 12345 })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("createSessionToken throws when SESSION_SECRET is not set", async () => {
    delete process.env.SESSION_SECRET;
    await expect(createSessionToken({ staffId: "s1" })).rejects.toThrow("SESSION_SECRET is not set.");
  });
});
