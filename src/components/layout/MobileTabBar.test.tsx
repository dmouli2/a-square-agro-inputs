import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileTabBar } from "./MobileTabBar";

const navState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
}));

describe("MobileTabBar", () => {
  beforeEach(() => {
    navState.pathname = "/";
  });

  it("renders all four tabs linking to their routes", () => {
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Shop/ })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("link", { name: /Cart/ })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("link", { name: /Orders/ })).toHaveAttribute("href", "/orders");
  });

  it("does not show a cart badge when cartCount is 0 or omitted", () => {
    render(<MobileTabBar />);
    const cartLink = screen.getByRole("link", { name: /Cart/ });
    expect(cartLink.querySelector("span > span")).not.toBeInTheDocument();
  });

  it("shows a cart badge with the count only on the cart tab", () => {
    render(<MobileTabBar cartCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /Home/ });
    expect(homeLink.textContent).not.toContain("3");
  });

  it("marks Home active on / and no other tab", () => {
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Shop/ })).not.toHaveAttribute("aria-current");
  });

  it("marks Shop active on /shop exactly, not on a nested product route", () => {
    navState.pathname = "/shop";
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: /Shop/ })).toHaveAttribute("aria-current", "page");
  });

  it("marks Orders active on a nested order detail route", () => {
    navState.pathname = "/orders/order-123";
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: /Orders/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Home/ })).not.toHaveAttribute("aria-current");
  });
});
