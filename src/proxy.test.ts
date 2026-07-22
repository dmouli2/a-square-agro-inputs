import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { verifySessionToken } from "@/lib/session";
import { proxy, config } from "./proxy";

vi.mock("@/lib/session", () => ({
  verifySessionToken: vi.fn(),
  SESSION_COOKIE_NAME: "a2_session",
}));

function makeRequest(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `a2_session=${cookie}`);
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

describe("proxy matcher", () => {
  it("matches /admin itself", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "http://localhost/admin" })).toBe(true);
  });

  it("matches nested admin routes", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "http://localhost/admin/products/new" })).toBe(true);
  });

  it("excludes the login page itself", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "http://localhost/admin/login" })).toBe(false);
  });

  it("excludes unrelated routes", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "http://localhost/shop" })).toBe(false);
  });
});

describe("proxy", () => {
  beforeEach(() => {
    vi.mocked(verifySessionToken).mockReset();
  });

  it("redirects to /admin/login when there is no session cookie at all", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue(null);
    const response = await proxy(makeRequest("/admin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin/login");
    expect(verifySessionToken).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when the cookie doesn't verify", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue(null);
    const response = await proxy(makeRequest("/admin/products", "bad-token"));
    expect(response.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("lets the request through when the cookie verifies", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue({ staffId: "s1" });
    const response = await proxy(makeRequest("/admin/products", "good-token"));
    expect(response.headers.get("location")).toBeNull();
  });
});
