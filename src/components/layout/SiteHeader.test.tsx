import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

const navState = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
  useSearchParams: () => new URLSearchParams(navState.search),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    navState.pathname = "/";
    navState.search = "";
  });

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

  it("marks Shop active on /shop with no category, and not the category links", () => {
    navState.pathname = "/shop";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Seeds" })).not.toHaveAttribute("aria-current");
  });

  it("marks the matching category link active on /shop?category=fertilizers", () => {
    navState.pathname = "/shop";
    navState.search = "category=fertilizers";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Fertilizers" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Shop" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Seeds" })).not.toHaveAttribute("aria-current");
  });

  it("does not mark any nav link active off the shop route", () => {
    navState.pathname = "/cart";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Shop" })).not.toHaveAttribute("aria-current");
  });

  it("marks the cart icon link active on /cart", () => {
    navState.pathname = "/cart";
    render(<SiteHeader />);
    const cartLinks = screen.getAllByRole("link", { name: "Cart" });
    expect(cartLinks[0]).toHaveAttribute("aria-current", "page");
  });
});
