import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory } from "@/test/fixtures";

const listCategories = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ categories: { list: listCategories } }),
}));

vi.mock("@/app/actions/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

import NewProductPage from "./page";

describe("NewProductPage", () => {
  beforeEach(() => {
    listCategories.mockReset();
  });

  it("renders the create-product form with the available categories", async () => {
    listCategories.mockResolvedValue([makeCategory(), makeCategory({ id: "cat-2", slug: "fertilizers", name: "Fertilizers" })]);

    const jsx = await NewProductPage();
    render(jsx);

    expect(screen.getByText("New product")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Seeds" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fertilizers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create product" })).toBeInTheDocument();
    // create mode shows the "first pack size" fields
    expect(screen.getByText("First pack size")).toBeInTheDocument();
  });

  it("renders with no categories yet", async () => {
    listCategories.mockResolvedValue([]);

    const jsx = await NewProductPage();
    render(jsx);

    expect(screen.getByText("New product")).toBeInTheDocument();
    expect(screen.getByText("Select category")).toBeInTheDocument();
  });
});
