import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeProduct } from "@/test/fixtures";

const getCartMap = vi.fn();
const findByVariantId = vi.fn();

vi.mock("@/lib/cart", () => ({
  getCartMap: (...args: unknown[]) => getCartMap(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    products: { findByVariantId },
  }),
}));

vi.mock("@/app/actions/cart", () => ({
  removeFromCart: vi.fn(),
  updateCartQuantity: vi.fn(),
  removeManyFromCart: vi.fn(),
}));

vi.mock("@/app/actions/checkout", () => ({
  placeOrder: vi.fn(),
}));

import CartPage from "./page";

describe("CartPage", () => {
  beforeEach(() => {
    getCartMap.mockReset();
    findByVariantId.mockReset();
  });

  it("renders an empty-cart state when the cart cookie has no entries", async () => {
    getCartMap.mockResolvedValue({});

    const jsx = await CartPage();
    render(jsx);

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("renders line items, subtotal and the checkout form when the cart resolves", async () => {
    const product = makeProduct();
    getCartMap.mockResolvedValue({ "var-1": 2 });
    findByVariantId.mockResolvedValue(product);

    const jsx = await CartPage();
    render(jsx);

    expect(screen.getByText("Your cart")).toBeInTheDocument();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Delivery details")).toBeInTheDocument();
  });

  it("shows the empty state and prunes stale variant ids when nothing in the cart still resolves", async () => {
    getCartMap.mockResolvedValue({ "ghost-variant": 1 });
    findByVariantId.mockResolvedValue(null);

    const jsx = await CartPage();
    render(jsx);

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("drops stale variants but still renders the resolved ones", async () => {
    const product = makeProduct();
    getCartMap.mockResolvedValue({ "var-1": 1, "ghost-variant": 1 });
    findByVariantId.mockImplementation(async (variantId: string) =>
      variantId === "var-1" ? product : null
    );

    const jsx = await CartPage();
    render(jsx);

    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
  });
});
