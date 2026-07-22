import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory, makeProduct } from "@/test/fixtures";

const listCategories = vi.fn();
const listAllProducts = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    categories: { list: listCategories },
    products: { listAll: listAllProducts },
  }),
}));

vi.mock("@/app/actions/categories", () => ({
  deleteCategory: vi.fn(),
}));

import AdminCategoriesPage from "./page";

describe("AdminCategoriesPage", () => {
  beforeEach(() => {
    listCategories.mockReset();
    listAllProducts.mockReset();
  });

  it("renders an empty-state message when there are no categories", async () => {
    listCategories.mockResolvedValue([]);
    listAllProducts.mockResolvedValue([]);

    const jsx = await AdminCategoriesPage();
    render(jsx);

    expect(screen.getByText("No categories yet — create the first one.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New category" })).toHaveAttribute("href", "/admin/categories/new");
  });

  it("renders a row per category with slug, sort order and product count", async () => {
    listCategories.mockResolvedValue([makeCategory({ sortOrder: 2 })]);
    listAllProducts.mockResolvedValue([makeProduct({ categoryId: "cat-1" })]);

    const jsx = await AdminCategoriesPage();
    render(jsx);

    expect(screen.getByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("seeds")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("in use")).toBeInTheDocument();
  });

  it("shows a Delete action only for categories with no products", async () => {
    listCategories.mockResolvedValue([makeCategory({ id: "cat-empty", slug: "empty", name: "Empty" })]);
    listAllProducts.mockResolvedValue([]);

    const jsx = await AdminCategoriesPage();
    render(jsx);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("omits the description line for a category with none", async () => {
    listCategories.mockResolvedValue([makeCategory({ description: undefined })]);
    listAllProducts.mockResolvedValue([]);

    const jsx = await AdminCategoriesPage();
    render(jsx);

    expect(screen.queryByText("Certified seeds")).not.toBeInTheDocument();
  });
});
