import { describe, it, expect, vi, beforeEach } from "vitest";

const createSupabaseImageStorage = vi.fn(() => ({ marker: "storage" }));
const hasSupabaseConfig = vi.fn();

vi.mock("./supabase/imageStorage", () => ({ createSupabaseImageStorage }));
vi.mock("@/lib/supabase/client", () => ({ hasSupabaseConfig }));

describe("getImageStorage", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseImageStorage.mockClear();
    hasSupabaseConfig.mockReset();
  });

  it("throws when Supabase is not configured", async () => {
    hasSupabaseConfig.mockReturnValue(false);
    const { getImageStorage } = await import("./index");
    expect(() => getImageStorage()).toThrow("Image storage requires Supabase to be configured.");
  });

  it("returns the Supabase-backed storage adapter when configured", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getImageStorage } = await import("./index");
    expect(getImageStorage()).toEqual({ marker: "storage" });
  });

  it("memoizes the instance across calls (singleton)", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getImageStorage } = await import("./index");
    getImageStorage();
    getImageStorage();
    expect(createSupabaseImageStorage).toHaveBeenCalledTimes(1);
  });

  it("resetImageStorageForTests forces a fresh instance to be created", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getImageStorage, resetImageStorageForTests } = await import("./index");
    getImageStorage();
    resetImageStorageForTests();
    getImageStorage();
    expect(createSupabaseImageStorage).toHaveBeenCalledTimes(2);
  });
});
