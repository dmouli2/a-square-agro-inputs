import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCarousel } from "./ProductCarousel";
import type { ProductWithVariants } from "@/types";

vi.mock("./ProductCard", () => ({
  ProductCard: ({ product, categorySlug }: { product: ProductWithVariants; categorySlug?: string }) => (
    <div>
      {product.name}
      {categorySlug ? ` (${categorySlug})` : ""}
    </div>
  ),
}));

function makeProducts(count: number): ProductWithVariants[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    slug: `p${i}`,
    name: `Product ${i}`,
    brand: "Brand",
    categoryId: "cat-1",
    description: "",
    images: [],
    status: "active",
    cropCompatibility: [],
    isBestseller: false,
    variants: [],
  }));
}

describe("ProductCarousel", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollBy = vi.fn();
  });

  it("renders a card for every product", () => {
    render(<ProductCarousel products={makeProducts(3)} />);
    expect(screen.getByText("Product 0")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
  });

  it("renders nothing when there are no products", () => {
    render(<ProductCarousel products={[]} />);
    expect(screen.queryByText(/Product/)).not.toBeInTheDocument();
  });

  it("looks up each product's category slug from categoryMap and passes it through", () => {
    render(<ProductCarousel products={makeProducts(1)} categoryMap={{ "cat-1": "seeds" }} />);
    expect(screen.getByText("Product 0 (seeds)")).toBeInTheDocument();
  });

  it("disables both scroll buttons when the track doesn't overflow (jsdom has zero layout)", () => {
    render(<ProductCarousel products={makeProducts(2)} />);
    expect(screen.getByRole("button", { name: "Scroll to previous products" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Scroll to more products" })).toBeDisabled();
  });

  it("enables the next button once the track can scroll further, and scrolling calls scrollBy", async () => {
    const user = userEvent.setup();
    render(<ProductCarousel products={makeProducts(4)} />);

    const track = screen.getByText("Product 0").closest(".no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2000, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 500, configurable: true });
    Object.defineProperty(track, "scrollLeft", { value: 0, writable: true, configurable: true });

    track.dispatchEvent(new Event("scroll"));

    const nextButton = await screen.findByRole("button", { name: "Scroll to more products" });
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);
    expect(track.scrollBy).toHaveBeenCalled();
  });

  it("enables the previous button once scrolled away from the start, and clicking it calls scrollBy", async () => {
    const user = userEvent.setup();
    render(<ProductCarousel products={makeProducts(4)} />);

    const track = screen.getByText("Product 0").closest(".no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2000, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 500, configurable: true });
    Object.defineProperty(track, "scrollLeft", { value: 100, writable: true, configurable: true });

    track.dispatchEvent(new Event("scroll"));

    const prevButton = await screen.findByRole("button", { name: "Scroll to previous products" });
    expect(prevButton).not.toBeDisabled();

    await user.click(prevButton);
    expect(track.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: expect.any(Number), behavior: "smooth" })
    );
  });

  it("recomputes scroll state on window resize", async () => {
    render(<ProductCarousel products={makeProducts(4)} />);
    const track = screen.getByText("Product 0").closest(".no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2000, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 500, configurable: true });
    Object.defineProperty(track, "scrollLeft", { value: 50, writable: true, configurable: true });

    window.dispatchEvent(new Event("resize"));

    expect(await screen.findByRole("button", { name: "Scroll to previous products" })).not.toBeDisabled();
  });
});
