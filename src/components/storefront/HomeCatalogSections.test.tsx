import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const listCategories = vi.fn();
const listProducts = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    categories: { list: listCategories },
    products: { list: listProducts },
  }),
}));

vi.mock("@/lib/cart", () => ({
  getCartMap: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

import { HomeCatalogSections } from "./HomeCatalogSections";

describe("HomeCatalogSections", () => {
  beforeEach(() => {
    listCategories.mockReset();
    listProducts.mockReset();
  });

  it("renders categories and featured products", async () => {
    listCategories.mockResolvedValue([makeCategory(), makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);
    listProducts.mockResolvedValue([makeProduct(), makeProduct({ id: "prod-2", slug: "urea", name: "Urea 46%" })]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.getAllByText("Seeds").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fertilizers").length).toBeGreaterThan(0);
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
    expect(screen.getByText("Popular right now")).toBeInTheDocument();
  });

  it("resolves a category fallback photo for a featured product with no images of its own", async () => {
    listCategories.mockResolvedValue([makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);
    listProducts.mockResolvedValue([makeProduct({ images: [], categoryId: "cat-2" })]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.getByText("Representative photo")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hybrid Maize Seed" })).toHaveAttribute(
      "src",
      "/images/categories/fertilizers.jpg"
    );
  });

  it("renders the shop-by-category showcase", async () => {
    listCategories.mockResolvedValue([makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);
    listProducts.mockResolvedValue([makeProduct()]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.getByText("Shop by category")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Fertilizers/ }).length).toBeGreaterThan(0);
  });

  it("shows the brand marquee once at least 3 distinct brands are in the catalog", async () => {
    listCategories.mockResolvedValue([makeCategory()]);
    listProducts.mockResolvedValue([
      makeProduct({ id: "p1", brand: "IFFCO" }),
      makeProduct({ id: "p2", brand: "Bayer" }),
      makeProduct({ id: "p3", brand: "Tata Rallis" }),
    ]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.getByLabelText("Brands we stock: Bayer, IFFCO, Tata Rallis")).toBeInTheDocument();
  });

  it("hides the brand marquee with fewer than 3 distinct brands", async () => {
    listCategories.mockResolvedValue([makeCategory()]);
    listProducts.mockResolvedValue([makeProduct({ id: "p1", brand: "IFFCO" })]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.queryByLabelText(/Brands we stock/)).not.toBeInTheDocument();
  });

  it("renders with no categories and no products", async () => {
    listCategories.mockResolvedValue([]);
    listProducts.mockResolvedValue([]);

    const jsx = await HomeCatalogSections();
    render(jsx);

    expect(screen.getByText("Popular right now")).toBeInTheDocument();
    expect(screen.getByText("Shop by category")).toBeInTheDocument();
  });
});
