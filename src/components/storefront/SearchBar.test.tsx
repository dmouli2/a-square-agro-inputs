import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders a GET form to /shop with the default placeholder and empty value", () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input).toHaveAttribute("placeholder", "Search seeds, fertilizers, sprayers…");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("name", "q");

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/shop");
    expect(form).toHaveAttribute("method", "GET");
  });

  it("applies a custom default value and placeholder", () => {
    render(<SearchBar defaultValue="urea" placeholder="Search…" />);
    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input).toHaveValue("urea");
    expect(input).toHaveAttribute("placeholder", "Search…");
  });

  it("uses smaller sizing classes by default and larger ones for size='lg'", () => {
    const { rerender } = render(<SearchBar />);
    expect(screen.getByRole("searchbox", { name: "Search products" })).toHaveClass("h-11");

    rerender(<SearchBar size="lg" />);
    expect(screen.getByRole("searchbox", { name: "Search products" })).toHaveClass("h-14");
  });

  it("merges a custom className onto the form", () => {
    render(<SearchBar className="mt-4" />);
    expect(screen.getByRole("search")).toHaveClass("mt-4");
  });
});
