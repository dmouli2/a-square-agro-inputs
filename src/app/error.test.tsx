import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RootError from "./error";

describe("RootError", () => {
  it("logs the error and renders a retry button that calls reset", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<RootError error={error} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
