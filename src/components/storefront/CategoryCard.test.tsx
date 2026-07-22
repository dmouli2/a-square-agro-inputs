import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "./CategoryCard";
import type { Category } from "@/types";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: "1", slug: "seeds", name: "Seeds", ...overrides };
}

describe("CategoryCard", () => {
  it("links to the shop filtered by category slug and shows the name", () => {
    render(<CategoryCard category={makeCategory()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shop?category=seeds");
    expect(screen.getByText("Seeds")).toBeInTheDocument();
  });

  it("shows the mapped icon for a known slug", () => {
    render(<CategoryCard category={makeCategory({ slug: "fertilizers", name: "Fertilizers" })} />);
    expect(screen.getByText("🌾")).toBeInTheDocument();
  });

  it("falls back to the generic icon for an unknown slug", () => {
    render(<CategoryCard category={makeCategory({ slug: "unknown-thing", name: "Other" })} />);
    expect(screen.getByText("🌿")).toBeInTheDocument();
  });
});
