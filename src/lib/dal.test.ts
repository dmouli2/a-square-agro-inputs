import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockCookieStore } from "../../vitest.setup";
import { verifySession, requireRole } from "./dal";
import { SESSION_COOKIE_NAME } from "./session";
import type { Staff } from "@/types";

const verifySessionToken = vi.fn();
const findById = vi.fn();

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return { ...actual, verifySessionToken: (...args: unknown[]) => verifySessionToken(...args) };
});

vi.mock("@/lib/db", () => ({
  getDb: () => ({ staff: { findById } }),
}));

const activeAdmin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

describe("verifySession", () => {
  beforeEach(() => {
    verifySessionToken.mockReset();
    findById.mockReset();
  });

  it("returns null when there is no session cookie", async () => {
    expect(await verifySession()).toBeNull();
    expect(verifySessionToken).not.toHaveBeenCalled();
  });

  it("returns null when the token doesn't verify", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "bad-token");
    verifySessionToken.mockResolvedValue(null);
    expect(await verifySession()).toBeNull();
  });

  it("returns null when the staff record no longer exists", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "token");
    verifySessionToken.mockResolvedValue({ staffId: "s1" });
    findById.mockResolvedValue(null);
    expect(await verifySession()).toBeNull();
  });

  it("returns null when the staff account has been deactivated", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "token");
    verifySessionToken.mockResolvedValue({ staffId: "s1" });
    findById.mockResolvedValue({ ...activeAdmin, active: false });
    expect(await verifySession()).toBeNull();
  });

  it("returns the staff record for a valid, active session", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "token");
    verifySessionToken.mockResolvedValue({ staffId: "s1" });
    findById.mockResolvedValue(activeAdmin);
    expect(await verifySession()).toEqual(activeAdmin);
  });
});

describe("requireRole", () => {
  beforeEach(() => {
    verifySessionToken.mockReset();
    findById.mockReset();
  });

  it("redirects to /admin/login when there is no valid session", async () => {
    await expect(requireRole(["admin"])).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });

  it("redirects to /admin/login when no role is allowed for this call", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "token");
    verifySessionToken.mockResolvedValue({ staffId: "s1" });
    findById.mockResolvedValue(activeAdmin);
    await expect(requireRole([])).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });

  it("returns the staff record when the role is allowed", async () => {
    mockCookieStore.set(SESSION_COOKIE_NAME, "token");
    verifySessionToken.mockResolvedValue({ staffId: "s1" });
    findById.mockResolvedValue(activeAdmin);
    await expect(requireRole(["admin"])).resolves.toEqual(activeAdmin);
  });
});
