import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartLineItem } from "./CartLineItem";
import { removeFromCart, updateCartQuantity } from "@/app/actions/cart";

vi.mock("@/app/actions/cart", () => ({
  removeFromCart: vi.fn(),
  updateCartQuantity: vi.fn(),
}));

const baseProps = {
  variantId: "v1",
  productName: "Urea 50kg",
  brand: "IFFCO",
  variantLabel: "50 kg bag",
  price: 300,
  quantity: 2,
};

describe("CartLineItem", () => {
  beforeEach(() => {
    vi.mocked(removeFromCart).mockReset();
    vi.mocked(updateCartQuantity).mockReset();
  });

  it("renders product details, quantity and the line total", () => {
    render(<CartLineItem {...baseProps} />);
    expect(screen.getByText("IFFCO")).toBeInTheDocument();
    expect(screen.getByText("Urea 50kg")).toBeInTheDocument();
    expect(screen.getByText("50 kg bag")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("₹600")).toBeInTheDocument();
  });

  it("increases quantity when + is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 3);
  });

  it("decreases quantity when - is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 1);
  });

  it("removes the item when the remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Remove item" }));
    expect(removeFromCart).toHaveBeenCalledWith("v1");
  });

  it("shows the brand initial in the thumbnail", () => {
    render(<CartLineItem {...baseProps} brand="Godrej" />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });
});
