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

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    listCategories.mockReset();
    listProducts.mockReset();
  });

  it("renders categories and featured products", async () => {
    listCategories.mockResolvedValue([makeCategory(), makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);
    listProducts.mockResolvedValue([makeProduct(), makeProduct({ id: "prod-2", slug: "urea", name: "Urea 46%" })]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("Fertilizers")).toBeInTheDocument();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
    expect(screen.getByText("Popular right now")).toBeInTheDocument();
  });

  it("renders with no categories and no products", async () => {
    listCategories.mockResolvedValue([]);
    listProducts.mockResolvedValue([]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByText("From the soil up, everything your fields need.")).toBeInTheDocument();
    expect(screen.getByText("Popular right now")).toBeInTheDocument();
  });
});
