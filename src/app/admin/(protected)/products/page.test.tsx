import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const listAllProducts = vi.fn();
const listCategories = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    products: { listAll: listAllProducts },
    categories: { list: listCategories },
  }),
}));

import AdminProductsPage from "./page";

function renderPage(searchParams: { q?: string; page?: string } = {}) {
  return AdminProductsPage({ searchParams: Promise.resolve(searchParams) }).then(render);
}

describe("AdminProductsPage", () => {
  beforeEach(() => {
    listAllProducts.mockReset();
    listCategories.mockReset();
  });

  it("renders an empty-state message when there are no products", async () => {
    listAllProducts.mockResolvedValue([]);
    listCategories.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText("No products yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New product" })).toHaveAttribute("href", "/admin/products/new");
  });

  it("renders a row per product with category name, status badge, pack size count and total stock", async () => {
    listAllProducts.mockResolvedValue([
      makeProduct({
        status: "draft",
        variants: [
          { id: "v1", productId: "prod-1", sku: "SKU-1", label: "1 kg", packSize: 1, unit: "kg", price: 10, mrp: 12, stockQty: 3 },
          { id: "v2", productId: "prod-1", sku: "SKU-2", label: "5 kg", packSize: 5, unit: "kg", price: 40, mrp: 45, stockQty: 7 },
        ],
      }),
    ]);
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage();

    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // pack sizes
    expect(screen.getByText("10")).toBeInTheDocument(); // total stock 3+7
  });

  it("falls back to an em dash when a product's category can't be found", async () => {
    listAllProducts.mockResolvedValue([makeProduct({ categoryId: "missing-cat" })]);
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage();

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("filters by name or brand (case-insensitive)", async () => {
    listAllProducts.mockResolvedValue([
      makeProduct({ id: "p1", name: "Hybrid Maize Seed", brand: "AgriCorp" }),
      makeProduct({ id: "p2", name: "Urea 50kg", brand: "IFFCO" }),
    ]);
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage({ q: "iffco" });
    expect(screen.getByText("Urea 50kg")).toBeInTheDocument();
    expect(screen.queryByText("Hybrid Maize Seed")).not.toBeInTheDocument();
  });

  it("shows a query-specific empty state when the search matches nothing", async () => {
    listAllProducts.mockResolvedValue([makeProduct()]);
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage({ q: "nonexistent" });
    expect(screen.getByText('No products match "nonexistent".')).toBeInTheDocument();
  });

  it("paginates to 20 products per page and links Next with the query preserved", async () => {
    listAllProducts.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => makeProduct({ id: `p${i}`, name: `Product ${i}` }))
    );
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage();
    expect(screen.getByText("Product 0")).toBeInTheDocument();
    expect(screen.queryByText("Product 20")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/products?page=2");
  });

  it("shows the second page of results", async () => {
    listAllProducts.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => makeProduct({ id: `p${i}`, name: `Product ${i}` }))
    );
    listCategories.mockResolvedValue([makeCategory()]);

    await renderPage({ page: "2" });
    expect(screen.getByText("Product 20")).toBeInTheDocument();
    expect(screen.queryByText("Product 0")).not.toBeInTheDocument();
  });
});
