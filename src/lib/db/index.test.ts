import { describe, it, expect, vi, beforeEach } from "vitest";

const createMockDb = vi.fn(() => ({ marker: "mock" }));
const createSupabaseDb = vi.fn(() => ({ marker: "supabase" }));
const hasSupabaseConfig = vi.fn();

vi.mock("@/lib/db/mock", () => ({ createMockDb }));
vi.mock("@/lib/db/supabase", () => ({ createSupabaseDb }));
vi.mock("@/lib/supabase/client", () => ({ hasSupabaseConfig }));

describe("getDb", () => {
  beforeEach(() => {
    vi.resetModules();
    createMockDb.mockClear();
    createSupabaseDb.mockClear();
    hasSupabaseConfig.mockReset();
  });

  it("wires in the Supabase adapter when Supabase is configured", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getDb } = await import("./index");
    expect(getDb()).toEqual({ marker: "supabase" });
    expect(createSupabaseDb).toHaveBeenCalledTimes(1);
    expect(createMockDb).not.toHaveBeenCalled();
  });

  it("falls back to the mock adapter when Supabase is not configured", async () => {
    hasSupabaseConfig.mockReturnValue(false);
    const { getDb } = await import("./index");
    expect(getDb()).toEqual({ marker: "mock" });
    expect(createMockDb).toHaveBeenCalledTimes(1);
  });

  it("memoizes the instance across calls (singleton)", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getDb } = await import("./index");
    getDb();
    getDb();
    expect(createSupabaseDb).toHaveBeenCalledTimes(1);
  });

  it("resetDbForTests forces a fresh instance to be created", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    const { getDb, resetDbForTests } = await import("./index");
    getDb();
    resetDbForTests();
    getDb();
    expect(createSupabaseDb).toHaveBeenCalledTimes(2);
  });
});
