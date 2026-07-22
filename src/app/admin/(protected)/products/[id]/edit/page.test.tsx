import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const findById = vi.fn();
const listCategories = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    products: { findById },
    categories: { list: listCategories },
  }),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

vi.mock("@/app/actions/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  addVariant: vi.fn(),
  editVariant: vi.fn(),
  removeVariant: vi.fn(),
}));

vi.mock("@/app/actions/productImages", () => ({
  removeProductImage: vi.fn(),
  uploadProductImage: vi.fn(),
}));

import EditProductPage from "./page";

describe("EditProductPage", () => {
  beforeEach(() => {
    findById.mockReset();
    listCategories.mockReset();
    listCategories.mockResolvedValue([makeCategory()]);
  });

  it("calls notFound() for an unknown product id", async () => {
    findById.mockResolvedValue(null);

    await expect(
      EditProductPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the product form, photo gallery and pack-size management for an existing product", async () => {
    findById.mockResolvedValue(makeProduct());

    const jsx = await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Hybrid Maize Seed" })).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove photo" })).toBeInTheDocument();
    expect(screen.getByText("Pack sizes")).toBeInTheDocument();
    expect(screen.getByText("1 kg · SKU-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("hides the photo grid when the product has no images and still renders the upload form", async () => {
    findById.mockResolvedValue(makeProduct({ images: [] }));

    const jsx = await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) });
    render(jsx);

    expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  it("renders multiple pack sizes and the add-pack-size form", async () => {
    findById.mockResolvedValue(
      makeProduct({
        variants: [
          { id: "v1", productId: "prod-1", sku: "SKU-1", label: "1 kg", packSize: 1, unit: "kg", price: 500, mrp: 600, stockQty: 20 },
          { id: "v2", productId: "prod-1", sku: "SKU-2", label: "5 kg", packSize: 5, unit: "kg", price: 2000, mrp: 2400, stockQty: 5 },
        ],
      })
    );

    const jsx = await EditProductPage({ params: Promise.resolve({ id: "prod-1" }) });
    render(jsx);

    expect(screen.getByText("1 kg · SKU-1")).toBeInTheDocument();
    expect(screen.getByText("5 kg · SKU-2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Label (e.g. 1 kg)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add pack size" })).toBeInTheDocument();
  });
});
