import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const listCategories = vi.fn();
const listProducts = vi.fn();
const getCartMap = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    categories: { list: listCategories },
    products: { list: listProducts },
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
  updateCartQuantity: vi.fn(),
}));

import ShopPage from "./page";

describe("ShopPage", () => {
  beforeEach(() => {
    listCategories.mockReset();
    listProducts.mockReset();
    getCartMap.mockReset();
    getCartMap.mockResolvedValue({});
    listCategories.mockResolvedValue([makeCategory(), makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);
  });

  it("renders the product grid for the default (no filter) listing", async () => {
    listProducts.mockResolvedValue([makeProduct(), makeProduct({ id: "prod-2", slug: "urea", name: "Urea 46%" })]);

    const jsx = await ShopPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Shop all products" })).toBeInTheDocument();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledWith({ categorySlug: undefined, search: undefined });
  });

  it("renders an empty state with category-specific copy when no category filter matches products", async () => {
    listProducts.mockResolvedValue([]);

    const jsx = await ShopPage({ searchParams: Promise.resolve({ category: "seeds" }) });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Seeds" })).toBeInTheDocument();
    expect(screen.getByText("No products in this category yet.")).toBeInTheDocument();
  });

  it("renders search results heading, count and empty-search copy", async () => {
    listProducts.mockResolvedValue([]);

    const jsx = await ShopPage({ searchParams: Promise.resolve({ q: "sprayer" }) });
    render(jsx);

    expect(screen.getByRole("heading", { name: /Results for/ })).toBeInTheDocument();
    expect(screen.getByText("0 products found", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("No products matched your search.")).toBeInTheDocument();
  });

  it("renders a pluralised singular product count for one search result", async () => {
    listProducts.mockResolvedValue([makeProduct()]);

    const jsx = await ShopPage({ searchParams: Promise.resolve({ q: "maize" }) });
    render(jsx);

    expect(screen.getByText("1 product found", { exact: false })).toBeInTheDocument();
  });

  it("shows the active category's description when set", async () => {
    listCategories.mockResolvedValue([makeCategory({ description: "Everything for a strong start." })]);
    listProducts.mockResolvedValue([]);

    const jsx = await ShopPage({ searchParams: Promise.resolve({ category: "seeds" }) });
    render(jsx);

    expect(screen.getByText("Everything for a strong start.")).toBeInTheDocument();
  });
});
