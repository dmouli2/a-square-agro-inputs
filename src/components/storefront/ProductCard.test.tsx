import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { CartCountProvider } from "./CartCountContext";
import type { ProductWithVariants } from "@/types";
import type { ReactElement } from "react";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
  updateCartQuantity: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

function renderCard(jsx: ReactElement) {
  return render(<CartCountProvider initialCount={0}>{jsx}</CartCountProvider>);
}

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
  it("shows a brand-initial placeholder when the product has no images and no category is given", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a category fallback photo when the product has no images but a known category is given", () => {
    renderCard(<ProductCard product={makeProduct()} categorySlug="fertilizers" />);
    expect(screen.queryByText("I")).not.toBeInTheDocument();
    expect(screen.getByText("Representative photo")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Urea 50kg Bag" })).toHaveAttribute(
      "src",
      "/images/categories/fertilizers.jpg"
    );
  });

  it("prefers the product's own photo over the category fallback when both are available", () => {
    renderCard(
      <ProductCard
        product={makeProduct({ images: ["products/urea.jpg"] })}
        categorySlug="fertilizers"
      />
    );
    expect(screen.queryByText("Representative photo")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Urea 50kg Bag" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/products/urea.jpg"
    );
  });

  it("renders the product photo when images are present", () => {
    renderCard(<ProductCard product={makeProduct({ images: ["products/urea.jpg"] })} />);
    const img = screen.getByRole("img", { name: "Urea 50kg Bag" });
    expect(img).toHaveAttribute("src", "https://cdn.example.com/products/urea.jpg");
  });

  it("links to the product detail page", () => {
    renderCard(<ProductCard product={makeProduct()} />);
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
    renderCard(<ProductCard product={product} />);
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bestseller")).not.toBeInTheDocument();
  });

  it("shows the Bestseller ribbon when in stock and flagged", () => {
    renderCard(<ProductCard product={makeProduct({ isBestseller: true })} />);
    expect(screen.getByText("Bestseller")).toBeInTheDocument();
  });

  it("shows neither badge when in stock and not a bestseller", () => {
    renderCard(<ProductCard product={makeProduct()} />);
    expect(screen.queryByText("Bestseller")).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("passes the cart map through to the add-to-cart actions", () => {
    renderCard(<ProductCard product={makeProduct()} cart={{ v1: 4 }} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
