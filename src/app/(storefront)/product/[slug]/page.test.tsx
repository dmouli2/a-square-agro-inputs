import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const findBySlug = vi.fn();
const listCategories = vi.fn();
const getCartMap = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    products: { findBySlug },
    categories: { list: listCategories },
  }),
}));

vi.mock("@/lib/cart", () => ({
  getCartMap: (...args: unknown[]) => getCartMap(...args),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
}));

import ProductDetailPage from "./page";

describe("ProductDetailPage", () => {
  beforeEach(() => {
    findBySlug.mockReset();
    listCategories.mockReset();
    getCartMap.mockReset();
    getCartMap.mockResolvedValue({});
    listCategories.mockResolvedValue([makeCategory()]);
  });

  it("calls notFound() for an unknown slug", async () => {
    findBySlug.mockResolvedValue(null);

    await expect(
      ProductDetailPage({ params: Promise.resolve({ slug: "does-not-exist" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders product details, breadcrumb category and crop compatibility tags", async () => {
    findBySlug.mockResolvedValue(makeProduct());

    const jsx = await ProductDetailPage({ params: Promise.resolve({ slug: "hybrid-maize-seed" }) });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Hybrid Maize Seed" })).toBeInTheDocument();
    expect(screen.getByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("Maize")).toBeInTheDocument();
  });

  it("renders compliance info when present and usage instructions", async () => {
    findBySlug.mockResolvedValue(
      makeProduct({
        activeIngredient: "Glyphosate 41% SL",
        composition: "41% w/w",
        registrationNumber: "CIB-12345",
        hsnCode: "3808",
        usageInstructions: "Dilute 5ml per litre of water.",
      })
    );

    const jsx = await ProductDetailPage({ params: Promise.resolve({ slug: "hybrid-maize-seed" }) });
    render(jsx);

    expect(screen.getByText("Glyphosate 41% SL")).toBeInTheDocument();
    expect(screen.getByText("CIB-12345")).toBeInTheDocument();
    expect(screen.getByText("3808")).toBeInTheDocument();
    expect(screen.getByText("Usage instructions")).toBeInTheDocument();
    expect(screen.getByText("Dilute 5ml per litre of water.")).toBeInTheDocument();
  });

  it("omits the breadcrumb category link and crop tags when there is no matching category / no crops", async () => {
    findBySlug.mockResolvedValue(makeProduct({ categoryId: "unknown-cat", cropCompatibility: [] }));

    const jsx = await ProductDetailPage({ params: Promise.resolve({ slug: "hybrid-maize-seed" }) });
    render(jsx);

    expect(screen.queryByRole("link", { name: "Seeds" })).not.toBeInTheDocument();
    expect(screen.queryByText("Maize")).not.toBeInTheDocument();
  });

  it("reflects existing cart quantities for the product's variants", async () => {
    findBySlug.mockResolvedValue(makeProduct());
    getCartMap.mockResolvedValue({ "var-1": 4 });

    const jsx = await ProductDetailPage({ params: Promise.resolve({ slug: "hybrid-maize-seed" }) });
    render(jsx);

    expect(screen.getByText("4 in your cart")).toBeInTheDocument();
  });
});
