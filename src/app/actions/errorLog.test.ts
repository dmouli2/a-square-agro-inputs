import { describe, it, expect, vi, beforeEach } from "vitest";
import { logErrorDetails } from "@/lib/errorLog";
import { reportClientError } from "./errorLog";

vi.mock("@/lib/errorLog", () => ({ logErrorDetails: vi.fn() }));

describe("reportClientError", () => {
  beforeEach(() => {
    vi.mocked(logErrorDetails).mockReset();
  });

  it("forwards the message, stack and path to logErrorDetails", async () => {
    await reportClientError("boom", "at x", "/cart");
    expect(logErrorDetails).toHaveBeenCalledWith({ message: "boom", stack: "at x", path: "/cart" });
  });

  it("passes an undefined stack through unchanged", async () => {
    await reportClientError("boom", undefined, "/");
    expect(logErrorDetails).toHaveBeenCalledWith({ message: "boom", stack: undefined, path: "/" });
  });
});
