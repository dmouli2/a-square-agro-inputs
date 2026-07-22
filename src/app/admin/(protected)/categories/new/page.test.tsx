import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/actions/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

import AdminNewCategoryPage from "./page";

describe("AdminNewCategoryPage", () => {
  it("renders the heading and the create-mode form", () => {
    render(<AdminNewCategoryPage />);
    expect(screen.getByText("New category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create category" })).toBeInTheDocument();
  });
});
