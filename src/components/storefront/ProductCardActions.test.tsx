import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCardActions } from "./ProductCardActions";
import { CartCountProvider } from "./CartCountContext";
import { addToCart, updateCartQuantity } from "@/app/actions/cart";
import type { ProductVariant } from "@/types";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn().mockResolvedValue(undefined),
  updateCartQuantity: vi.fn().mockResolvedValue(undefined),
}));

/** A promise the test controls the resolution of, so it can assert on the optimistic UI state
 *  while the "server round trip" is still in flight — once resolved, useOptimistic reverts to
 *  the (unchanged, in an isolated component test) `cart` prop, same as it would in the real app
 *  while waiting for the parent to re-render with the server's confirmed value. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "v1",
    productId: "p1",
    sku: "SKU1",
    label: "500 g",
    packSize: 500,
    unit: "g",
    price: 100,
    mrp: 120,
    stockQty: 10,
    ...overrides,
  };
}

function renderActions(variants: ProductVariant[], cart: Record<string, number>, initialCartCount = 0) {
  return render(
    <CartCountProvider initialCount={initialCartCount}>
      <ProductCardActions variants={variants} cart={cart} />
    </CartCountProvider>
  );
}

describe("ProductCardActions", () => {
  beforeEach(() => {
    vi.mocked(addToCart).mockClear();
    vi.mocked(updateCartQuantity).mockClear();
  });

  it("does not render a variant selector when there is only one variant", () => {
    renderActions([makeVariant()], {});
    expect(screen.queryByRole("button", { name: "500 g" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add to cart/ })).toBeInTheDocument();
  });

  it("renders a selector for multiple variants and switches the displayed price on click", async () => {
    const variants = [
      makeVariant({ id: "v1", label: "500 g", price: 100, mrp: 120 }),
      makeVariant({ id: "v2", label: "1 kg", price: 180, mrp: 220 }),
    ];
    const user = userEvent.setup();
    renderActions(variants, {});

    expect(screen.getByText("₹100")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 kg" }));
    expect(screen.getByText("₹180")).toBeInTheDocument();
  });

  it("selects the lowest-priced variant by default", () => {
    const variants = [
      makeVariant({ id: "v1", label: "1 kg", price: 180 }),
      makeVariant({ id: "v2", label: "500 g", price: 100 }),
    ];
    renderActions(variants, {});
    expect(screen.getByText("₹100")).toBeInTheDocument();
  });

  it("shows Out of stock and no add-to-cart control when the selected variant has no stock", () => {
    renderActions([makeVariant({ stockQty: 0 })], {});
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to cart/ })).not.toBeInTheDocument();
  });

  it("shows the stepper immediately (optimistically), before addToCart resolves", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(addToCart).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderActions([makeVariant()], {});

    await user.click(screen.getByRole("button", { name: /Add to cart/ }));

    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(addToCart).toHaveBeenCalledWith("v1", 1);
    resolve();
  });

  it("shows a quantity stepper when the variant is already in the cart", () => {
    renderActions([makeVariant()], { v1: 3 });
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeInTheDocument();
  });

  it("increases quantity optimistically, before updateCartQuantity resolves", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(updateCartQuantity).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderActions([makeVariant()], { v1: 2 });

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 3);
    resolve();
  });

  it("decreases quantity optimistically, before updateCartQuantity resolves", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(updateCartQuantity).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderActions([makeVariant()], { v1: 2 });

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 1);
    resolve();
  });

  it("dims out-of-stock variant chips", () => {
    const variants = [
      makeVariant({ id: "v1", label: "500 g", stockQty: 5 }),
      makeVariant({ id: "v2", label: "1 kg", stockQty: 0 }),
    ];
    renderActions(variants, {});
    expect(screen.getByRole("button", { name: "1 kg" })).toHaveClass("opacity-40");
  });
});
