import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryShowcase } from "./CategoryShowcase";
import type { Category } from "@/types";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: "1", slug: "seeds", name: "Seeds", ...overrides };
}

describe("CategoryShowcase", () => {
  it("renders nothing when there are no categories", () => {
    const { container } = render(<CategoryShowcase categories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each tile to the shop filtered by category slug", () => {
    render(<CategoryShowcase categories={[makeCategory(), makeCategory({ id: "2", slug: "tools-equipment", name: "Tools & Equipment" })]} />);
    expect(screen.getByRole("link", { name: /Seeds/ })).toHaveAttribute("href", "/shop?category=seeds");
    expect(screen.getByRole("link", { name: /Tools & Equipment/ })).toHaveAttribute(
      "href",
      "/shop?category=tools-equipment"
    );
  });

  it("shows the category photo for a mapped slug", () => {
    render(<CategoryShowcase categories={[makeCategory({ slug: "fertilizers", name: "Fertilizers" })]} />);
    expect(screen.getByAltText("")).toHaveAttribute("src", "/images/categories/fertilizers.jpg");
  });

  it("falls back to a plain icon tile for an unmapped category slug", () => {
    render(<CategoryShowcase categories={[makeCategory({ slug: "seasonal-offers", name: "Seasonal Offers" })]} />);
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
    expect(screen.getByText("🌿")).toBeInTheDocument();
  });
});
