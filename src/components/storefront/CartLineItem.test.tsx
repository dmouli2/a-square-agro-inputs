import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartLineItem } from "./CartLineItem";

const baseProps = {
  productName: "Urea 50kg",
  brand: "IFFCO",
  variantLabel: "50 kg bag",
  price: 300,
  quantity: 2,
  onQuantityChange: vi.fn(),
  onRemove: vi.fn(),
};

describe("CartLineItem", () => {
  beforeEach(() => {
    baseProps.onQuantityChange.mockReset();
    baseProps.onRemove.mockReset();
  });

  it("renders product details, quantity and the line total", () => {
    render(<CartLineItem {...baseProps} />);
    expect(screen.getByText("IFFCO")).toBeInTheDocument();
    expect(screen.getByText("Urea 50kg")).toBeInTheDocument();
    expect(screen.getByText("50 kg bag")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("₹600")).toBeInTheDocument();
  });

  it("calls onQuantityChange with quantity+1 when + is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(baseProps.onQuantityChange).toHaveBeenCalledWith(3);
  });

  it("calls onQuantityChange with quantity-1 when - is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(baseProps.onQuantityChange).toHaveBeenCalledWith(1);
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<CartLineItem {...baseProps} />);
    await user.click(screen.getByRole("button", { name: "Remove item" }));
    expect(baseProps.onRemove).toHaveBeenCalled();
  });

  it("shows the brand initial in the thumbnail", () => {
    render(<CartLineItem {...baseProps} brand="Godrej" />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });
});
