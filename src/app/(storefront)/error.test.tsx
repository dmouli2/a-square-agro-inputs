import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StorefrontError from "./error";

describe("StorefrontError", () => {
  it("logs the error and lets the user retry or go back to the shop", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "xyz" });

    render(<StorefrontError error={error} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);

    const link = screen.getByRole("link", { name: "Back to shop" });
    expect(link).toHaveAttribute("href", "/shop");

    consoleSpy.mockRestore();
  });
});
