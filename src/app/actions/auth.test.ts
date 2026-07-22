import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { mockCookieStore } from "../../../vitest.setup";
import { getDb } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { login, logout } from "./auth";
import type { Staff } from "@/types";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/session", () => ({
  createSessionToken: vi.fn(async () => "signed-token"),
  SESSION_COOKIE_NAME: "a2_session",
}));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const passwordHash = bcrypt.hashSync("correct-horse-battery-staple", 10);
const admin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash, role: "admin", active: true };

describe("login", () => {
  const findByEmail = vi.fn();

  beforeEach(() => {
    findByEmail.mockReset();
    vi.mocked(getDb).mockReturnValue({ staff: { findByEmail } } as never);
    mockCookieStore.set.mockClear();
  });

  it("rejects a submission missing email or password without hitting the database", async () => {
    const result = await login({ error: null }, formData({ email: "", password: "" }));
    expect(result.error).toMatch(/enter your email and password/i);
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only email", async () => {
    const result = await login({ error: null }, formData({ email: "   ", password: "x" }));
    expect(result.error).toMatch(/enter your email and password/i);
  });

  it("returns a generic error for an email with no matching account", async () => {
    findByEmail.mockResolvedValue(null);
    const result = await login({ error: null }, formData({ email: "nobody@example.com", password: "whatever" }));
    expect(result.error).toBe("Invalid email or password.");
  });

  it("returns a generic error for a deactivated account, even with the right password", async () => {
    findByEmail.mockResolvedValue({ ...admin, active: false });
    const result = await login({ error: null }, formData({ email: admin.email, password: "correct-horse-battery-staple" }));
    expect(result.error).toBe("Invalid email or password.");
  });

  it("returns a generic error for the wrong password", async () => {
    findByEmail.mockResolvedValue(admin);
    const result = await login({ error: null }, formData({ email: admin.email, password: "wrong-password" }));
    expect(result.error).toBe("Invalid email or password.");
  });

  it("normalizes the email (trim + lowercase) before looking it up", async () => {
    findByEmail.mockResolvedValue(admin);
    await login({ error: null }, formData({ email: "  Admin@Example.com  ", password: "wrong" })).catch(() => {});
    expect(findByEmail).toHaveBeenCalledWith("admin@example.com");
  });

  it("signs a session and redirects to /admin on success", async () => {
    findByEmail.mockResolvedValue(admin);
    await expect(login({ error: null }, formData({ email: admin.email, password: "correct-horse-battery-staple" }))).rejects.toThrow(
      "NEXT_REDIRECT:/admin"
    );
    expect(createSessionToken).toHaveBeenCalledWith({ staffId: "s1" });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "signed-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" })
    );
  });
});

describe("logout", () => {
  it("deletes the session cookie and redirects to /admin/login", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockCookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});

