import { describe, it, expect } from "vitest";
import { mockHeadersStore } from "../../vitest.setup";
import { getClientIp } from "./net";

describe("getClientIp", () => {
  it("uses the first address in x-forwarded-for", async () => {
    mockHeadersStore.get.mockImplementation((name: string) => (name === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8" : null));
    expect(await getClientIp()).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    mockHeadersStore.get.mockImplementation((name: string) => (name === "x-real-ip" ? "9.8.7.6" : null));
    expect(await getClientIp()).toBe("9.8.7.6");
  });

  it("falls back to 'unknown' when neither header is present", async () => {
    mockHeadersStore.get.mockReturnValue(null);
    expect(await getClientIp()).toBe("unknown");
  });
});
