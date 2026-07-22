import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the brand mark and links to home", () => {
    render(<Logo />);
    expect(screen.getByText("A²")).toBeInTheDocument();
    expect(screen.getByText("A Square")).toBeInTheDocument();
    expect(screen.getByText("Agro Inputs")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("merges a custom className onto the link", () => {
    render(<Logo className="text-white" />);
    expect(screen.getByRole("link")).toHaveClass("text-white");
  });
});
