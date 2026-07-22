import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCardActions } from "./ProductCardActions";
import { addToCart, updateCartQuantity } from "@/app/actions/cart";
import type { ProductVariant } from "@/types";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
  updateCartQuantity: vi.fn(),
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

describe("ProductCardActions", () => {
  beforeEach(() => {
    vi.mocked(addToCart).mockReset();
    vi.mocked(updateCartQuantity).mockReset();
  });

  it("does not render a variant selector when there is only one variant", () => {
    render(<ProductCardActions variants={[makeVariant()]} cart={{}} />);
    expect(screen.queryByRole("button", { name: "500 g" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add to cart/ })).toBeInTheDocument();
  });

  it("renders a selector for multiple variants and switches the displayed price on click", async () => {
    const variants = [
      makeVariant({ id: "v1", label: "500 g", price: 100, mrp: 120 }),
      makeVariant({ id: "v2", label: "1 kg", price: 180, mrp: 220 }),
    ];
    const user = userEvent.setup();
    render(<ProductCardActions variants={variants} cart={{}} />);

    expect(screen.getByText("₹100")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 kg" }));
    expect(screen.getByText("₹180")).toBeInTheDocument();
  });

  it("selects the lowest-priced variant by default", () => {
    const variants = [
      makeVariant({ id: "v1", label: "1 kg", price: 180 }),
      makeVariant({ id: "v2", label: "500 g", price: 100 }),
    ];
    render(<ProductCardActions variants={variants} cart={{}} />);
    expect(screen.getByText("₹100")).toBeInTheDocument();
  });

  it("shows Out of stock and no add-to-cart control when the selected variant has no stock", () => {
    render(<ProductCardActions variants={[makeVariant({ stockQty: 0 })]} cart={{}} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to cart/ })).not.toBeInTheDocument();
  });

  it("calls addToCart with quantity 1 when Add to cart is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductCardActions variants={[makeVariant()]} cart={{}} />);
    await user.click(screen.getByRole("button", { name: /Add to cart/ }));
    expect(addToCart).toHaveBeenCalledWith("v1", 1);
  });

  it("shows a quantity stepper when the variant is already in the cart", () => {
    render(<ProductCardActions variants={[makeVariant()]} cart={{ v1: 3 }} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeInTheDocument();
  });

  it("increases and decreases quantity via updateCartQuantity", async () => {
    const user = userEvent.setup();
    render(<ProductCardActions variants={[makeVariant()]} cart={{ v1: 2 }} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 3);

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 1);
  });

  it("dims out-of-stock variant chips", () => {
    const variants = [
      makeVariant({ id: "v1", label: "500 g", stockQty: 5 }),
      makeVariant({ id: "v2", label: "1 kg", stockQty: 0 }),
    ];
    render(<ProductCardActions variants={variants} cart={{}} />);
    expect(screen.getByRole("button", { name: "1 kg" })).toHaveClass("opacity-40");
  });
});
