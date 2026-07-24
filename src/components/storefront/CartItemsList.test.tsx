import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItemsList, type CartItemData } from "./CartItemsList";
import { CartCountProvider } from "./CartCountContext";
import { removeFromCart, updateCartQuantity } from "@/app/actions/cart";

vi.mock("@/app/actions/cart", () => ({
  removeFromCart: vi.fn().mockResolvedValue(undefined),
  updateCartQuantity: vi.fn().mockResolvedValue(undefined),
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const items: CartItemData[] = [
  { variantId: "v1", productName: "Urea 50kg", brand: "IFFCO", variantLabel: "50 kg bag", price: 300, quantity: 2 },
  { variantId: "v2", productName: "DAP Fertilizer", brand: "IFFCO", variantLabel: "25 kg bag", price: 500, quantity: 1 },
];

function renderList(initialItems: CartItemData[], initialCartCount = 0) {
  return render(
    <CartCountProvider initialCount={initialCartCount}>
      <CartItemsList initialItems={initialItems} />
    </CartCountProvider>
  );
}

describe("CartItemsList", () => {
  beforeEach(() => {
    vi.mocked(removeFromCart).mockClear();
    vi.mocked(updateCartQuantity).mockClear();
  });

  it("renders each item and the checkout form with the combined subtotal", () => {
    renderList(items);
    expect(screen.getByText("Urea 50kg")).toBeInTheDocument();
    expect(screen.getByText("DAP Fertilizer")).toBeInTheDocument();
    // (300*2) + (500*1) = 1100
    expect(screen.getAllByText("₹1,100").length).toBeGreaterThan(0);
  });

  it("shows the empty-cart message once every item has been optimistically removed", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(removeFromCart).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderList([items[0]]);

    await user.click(screen.getByRole("button", { name: "Remove item" }));

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
    expect(removeFromCart).toHaveBeenCalledWith("v1");
    resolve();
  });

  it("removes an item immediately on click, before removeFromCart resolves", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(removeFromCart).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderList(items);

    const [firstRemoveButton] = screen.getAllByRole("button", { name: "Remove item" });
    await user.click(firstRemoveButton);

    await expect(screen.findByText("Urea 50kg")).rejects.toThrow();
    expect(screen.getByText("DAP Fertilizer")).toBeInTheDocument();
    resolve();
  });

  it("updates the subtotal immediately when a quantity changes, before updateCartQuantity resolves", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(updateCartQuantity).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderList([items[0]]);

    const increaseButton = screen.getByRole("button", { name: "Increase quantity" });
    await user.click(increaseButton);

    // quantity 2 -> 3 at price 300 = 900
    expect(await screen.findAllByText("₹900")).not.toHaveLength(0);
    expect(updateCartQuantity).toHaveBeenCalledWith("v1", 3);
    resolve();
  });

  it("treats decreasing quantity to 0 as a removal", async () => {
    const { promise, resolve } = deferred();
    vi.mocked(removeFromCart).mockReturnValueOnce(promise);
    const user = userEvent.setup();
    renderList([{ ...items[0], quantity: 1 }]);

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
    expect(removeFromCart).toHaveBeenCalledWith("v1");
    expect(updateCartQuantity).not.toHaveBeenCalled();
    resolve();
  });
});
