import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/cart", () => ({
  getCartMap: vi.fn(),
  getCartCount: vi.fn(),
}));

import { getCartCount } from "@/lib/cart";
import StorefrontLayout from "./layout";

describe("StorefrontLayout", () => {
  beforeEach(() => {
    vi.mocked(getCartCount).mockResolvedValue(3);
  });

  it("renders header, footer, mobile tab bar and children with the cart count", async () => {
    const jsx = await StorefrontLayout({ children: <p>page body</p> });
    render(jsx);

    expect(screen.getByText("page body")).toBeInTheDocument();
    // cart count badge appears (desktop header + mobile tab bar both render it)
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("renders with a zero cart count", async () => {
    vi.mocked(getCartCount).mockResolvedValue(0);
    const jsx = await StorefrontLayout({ children: <p>empty cart body</p> });
    render(jsx);

    expect(screen.getByText("empty cart body")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
