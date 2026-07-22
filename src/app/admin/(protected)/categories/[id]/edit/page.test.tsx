import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCategory } from "@/test/fixtures";

const findById = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ categories: { findById } }),
}));

vi.mock("@/app/actions/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

import AdminEditCategoryPage from "./page";

describe("AdminEditCategoryPage", () => {
  beforeEach(() => {
    findById.mockReset();
  });

  it("calls notFound() when the category id does not resolve", async () => {
    findById.mockResolvedValue(null);
    await expect(
      AdminEditCategoryPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the edit-mode form prefilled with the category", async () => {
    findById.mockResolvedValue(makeCategory());

    const jsx = await AdminEditCategoryPage({ params: Promise.resolve({ id: "cat-1" }) });
    render(jsx);

    expect(screen.getByText("Edit category")).toBeInTheDocument();
    expect(screen.getByLabelText("Category name")).toHaveValue("Seeds");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
