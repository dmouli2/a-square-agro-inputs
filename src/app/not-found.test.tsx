import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootNotFound from "./not-found";

describe("RootNotFound", () => {
  it("renders a not-found message with a link home", () => {
    render(<RootNotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Go home" });
    expect(link).toHaveAttribute("href", "/");
  });
});
