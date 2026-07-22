import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSupabaseClient, hasSupabaseConfig, isInvalidUuidError, resetSupabaseClientForTests } from "./client";

describe("hasSupabaseConfig", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("is true when both env vars are set", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(hasSupabaseConfig()).toBe(true);
  });

  it("is false when the URL is missing", () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(hasSupabaseConfig()).toBe(false);
  });

  it("is false when the service role key is missing", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(hasSupabaseConfig()).toBe(false);
  });
});

describe("getSupabaseClient", () => {
  const original = { ...process.env };

  beforeEach(() => {
    resetSupabaseClientForTests();
  });

  afterEach(() => {
    process.env = { ...original };
    resetSupabaseClientForTests();
  });

  it("throws when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseClient()).toThrow("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
  });

  it("creates and memoizes a client once configured", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const first = getSupabaseClient();
    const second = getSupabaseClient();
    expect(first).toBe(second);
  });

  it("resetSupabaseClientForTests forces a fresh client on the next call", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const first = getSupabaseClient();
    resetSupabaseClientForTests();
    const second = getSupabaseClient();
    expect(first).not.toBe(second);
  });
});

describe("isInvalidUuidError", () => {
  it("is true for Postgres's invalid-uuid error code", () => {
    expect(isInvalidUuidError({ code: "22P02" })).toBe(true);
  });

  it("is false for other error codes", () => {
    expect(isInvalidUuidError({ code: "23505" })).toBe(false);
  });

  it("is false for null/undefined errors", () => {
    expect(isInvalidUuidError(null)).toBe(false);
    expect(isInvalidUuidError(undefined)).toBe(false);
  });
});
