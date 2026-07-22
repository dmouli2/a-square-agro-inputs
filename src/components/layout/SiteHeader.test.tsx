import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders the desktop nav links and search bar", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("link", { name: "Seeds" })).toHaveAttribute("href", "/shop?category=seeds");
    expect(screen.getByRole("link", { name: "Fertilizers" })).toHaveAttribute(
      "href",
      "/shop?category=fertilizers"
    );
    expect(screen.getByRole("link", { name: "Crop Protection" })).toHaveAttribute(
      "href",
      "/shop?category=crop-protection"
    );
  });

  it("does not show a cart badge when cartCount is 0", () => {
    render(<SiteHeader />);
    const cartLinks = screen.getAllByRole("link", { name: "Cart" });
    cartLinks.forEach((link) => expect(link.textContent).toBe(""));
  });

  it("shows the cart count badge when cartCount is positive", () => {
    render(<SiteHeader cartCount={5} />);
    const badges = screen.getAllByText("5");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders the mobile header search area too", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument();
  });
});
