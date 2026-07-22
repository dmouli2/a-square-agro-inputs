import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDb } from "@/lib/db";
import { logError } from "./errorLog";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

describe("logError", () => {
  const create = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    create.mockReset();
    consoleErrorSpy.mockClear();
    vi.mocked(getDb).mockReturnValue({ errorLogs: { create } } as never);
  });

  it("extracts message and stack from an Error", async () => {
    const error = new Error("boom");
    await logError(error, "/cart", { orderId: "ORD-1" });
    expect(create).toHaveBeenCalledWith({ message: "boom", stack: error.stack, path: "/cart", context: { orderId: "ORD-1" } });
  });

  it("stringifies a non-Error value and omits the stack", async () => {
    await logError("just a string");
    expect(create).toHaveBeenCalledWith({ message: "just a string", stack: undefined, path: undefined, context: undefined });
  });

  it("swallows a failure from the repository instead of throwing", async () => {
    create.mockRejectedValue(new Error("db down"));
    await expect(logError(new Error("boom"))).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
