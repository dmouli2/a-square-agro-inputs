import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { addToCart } from "@/app/actions/cart";
import type { ProductVariant } from "@/types";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
}));

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

describe("ProductPurchasePanel", () => {
  beforeEach(() => {
    vi.mocked(addToCart).mockReset();
    vi.mocked(addToCart).mockResolvedValue(undefined);
  });

  it("renders a fallback instead of crashing when a product has no variants left", () => {
    render(<ProductPurchasePanel variants={[]} initialCartQuantities={{}} />);
    expect(screen.getByText("This product is currently unavailable.")).toBeInTheDocument();
  });

  it("does not render a pack-size selector for a single variant", () => {
    render(<ProductPurchasePanel variants={[makeVariant()]} initialCartQuantities={{}} />);
    expect(screen.queryByText("Pack size")).not.toBeInTheDocument();
  });

  it("renders a pack-size selector and switches price on click for multiple variants", async () => {
    const variants = [
      makeVariant({ id: "v1", label: "500 g", price: 100 }),
      makeVariant({ id: "v2", label: "1 kg", price: 180 }),
    ];
    const user = userEvent.setup();
    render(<ProductPurchasePanel variants={variants} initialCartQuantities={{}} />);

    expect(screen.getByText("₹100")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 kg" }));
    expect(screen.getByText("₹180")).toBeInTheDocument();
  });

  it("steps the quantity up and down, never going below 1", async () => {
    const user = userEvent.setup();
    render(<ProductPurchasePanel variants={[makeVariant()]} initialCartQuantities={{}} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByText("3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows Out of stock and disables adding when the selected variant has no stock", () => {
    render(<ProductPurchasePanel variants={[makeVariant({ stockQty: 0 })]} initialCartQuantities={{}} />);
    const button = screen.getByRole("button", { name: "Out of stock" });
    expect(button).toBeDisabled();
  });

  it("adds to cart, then shows the in-cart state with a link to the cart", async () => {
    const user = userEvent.setup();
    render(<ProductPurchasePanel variants={[makeVariant()]} initialCartQuantities={{}} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(addToCart).toHaveBeenCalledWith("v1", 2);
    expect(await screen.findByText("2 in your cart")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to cart" })).toHaveAttribute("href", "/cart");
  });

  it("starts directly in the in-cart state when initialCartQuantities has an entry", () => {
    render(<ProductPurchasePanel variants={[makeVariant()]} initialCartQuantities={{ v1: 5 }} />);
    expect(screen.getByText("5 in your cart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to cart" })).not.toBeInTheDocument();
  });

  it("shows a pending label while the add-to-cart action resolves", async () => {
    let resolveAdd!: () => void;
    vi.mocked(addToCart).mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = () => resolve(undefined);
      })
    );
    const user = userEvent.setup();
    render(<ProductPurchasePanel variants={[makeVariant()]} initialCartQuantities={{}} />);

    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(await screen.findByRole("button", { name: "Adding…" })).toBeDisabled();

    resolveAdd();
    expect(await screen.findByText("1 in your cart")).toBeInTheDocument();
  });
});
