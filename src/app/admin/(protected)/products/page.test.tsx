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

describe("AdminProductsPage", () => {
  beforeEach(() => {
    listAllProducts.mockReset();
    listCategories.mockReset();
  });

  it("renders an empty-state message when there are no products", async () => {
    listAllProducts.mockResolvedValue([]);
    listCategories.mockResolvedValue([]);

    const jsx = await AdminProductsPage();
    render(jsx);

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

    const jsx = await AdminProductsPage();
    render(jsx);

    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // pack sizes
    expect(screen.getByText("10")).toBeInTheDocument(); // total stock 3+7
  });

  it("falls back to an em dash when a product's category can't be found", async () => {
    listAllProducts.mockResolvedValue([makeProduct({ categoryId: "missing-cat" })]);
    listCategories.mockResolvedValue([makeCategory()]);

    const jsx = await AdminProductsPage();
    render(jsx);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
