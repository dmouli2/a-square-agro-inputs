import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { ProductWithVariants } from "@/types";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
  updateCartQuantity: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

function makeProduct(overrides: Partial<ProductWithVariants> = {}): ProductWithVariants {
  return {
    id: "p1",
    slug: "urea-50kg",
    name: "Urea 50kg Bag",
    brand: "IFFCO",
    categoryId: "cat-1",
    description: "",
    images: [],
    status: "active",
    cropCompatibility: [],
    isBestseller: false,
    variants: [
      {
        id: "v1",
        productId: "p1",
        sku: "SKU1",
        label: "50 kg",
        packSize: 50,
        unit: "kg",
        price: 300,
        mrp: 350,
        stockQty: 10,
      },
    ],
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("shows a brand-initial placeholder when the product has no images", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the product photo when images are present", () => {
    render(<ProductCard product={makeProduct({ images: ["products/urea.jpg"] })} />);
    const img = screen.getByRole("img", { name: "Urea 50kg Bag" });
    expect(img).toHaveAttribute("src", "https://cdn.example.com/products/urea.jpg");
  });

  it("links to the product detail page", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/product/urea-50kg");
  });

  it("shows the Out of stock badge when every variant is out of stock, even if bestseller", () => {
    const product = makeProduct({
      isBestseller: true,
      variants: [
        {
          id: "v1",
          productId: "p1",
          sku: "SKU1",
          label: "50 kg",
          packSize: 50,
          unit: "kg",
          price: 300,
          mrp: 350,
          stockQty: 0,
        },
      ],
    });
    render(<ProductCard product={product} />);
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bestseller")).not.toBeInTheDocument();
  });

  it("shows the Bestseller ribbon when in stock and flagged", () => {
    render(<ProductCard product={makeProduct({ isBestseller: true })} />);
    expect(screen.getByText("Bestseller")).toBeInTheDocument();
  });

  it("shows neither badge when in stock and not a bestseller", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.queryByText("Bestseller")).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("passes the cart map through to the add-to-cart actions", () => {
    render(<ProductCard product={makeProduct()} cart={{ v1: 4 }} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
