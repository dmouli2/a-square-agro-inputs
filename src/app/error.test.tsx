import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { reportClientError } from "@/app/actions/errorLog";
import RootError from "./error";

vi.mock("@/app/actions/errorLog", () => ({ reportClientError: vi.fn() }));

describe("RootError", () => {
  beforeEach(() => {
    vi.mocked(reportClientError).mockReset().mockResolvedValue(undefined);
  });

  it("logs the error, reports it for /admin/errors, and renders a retry button that calls reset", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<RootError error={error} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(reportClientError).toHaveBeenCalledWith("boom", error.stack, "/");
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it("does not crash the boundary if reporting the error itself fails", async () => {
    vi.mocked(reportClientError).mockRejectedValue(new Error("network down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    render(<RootError error={error} reset={vi.fn()} />);
    await screen.findByText("Something went wrong");

    consoleSpy.mockRestore();
  });
});
