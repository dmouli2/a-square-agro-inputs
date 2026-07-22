import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "./CategoryForm";
import { createCategory, updateCategory } from "@/app/actions/categories";
import type { Category } from "@/types";

vi.mock("@/app/actions/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

const category: Category = {
  id: "cat-1",
  slug: "seeds",
  name: "Seeds",
  description: "Certified seeds",
  parentId: null,
  sortOrder: 3,
};

describe("CategoryForm", () => {
  beforeEach(() => {
    vi.mocked(createCategory).mockReset();
    vi.mocked(updateCategory).mockReset();
  });

  it("renders empty fields with a default sort order of 0 in create mode", () => {
    render(<CategoryForm mode="create" />);
    expect(screen.getByLabelText("Category name")).toHaveValue("");
    expect(screen.getByLabelText("Sort order")).toHaveValue(0);
    expect(screen.getByRole("button", { name: "Create category" })).toBeInTheDocument();
  });

  it("renders prefilled fields in edit mode", () => {
    render(<CategoryForm mode="edit" category={category} />);
    expect(screen.getByLabelText("Category name")).toHaveValue("Seeds");
    expect(screen.getByLabelText("Description")).toHaveValue("Certified seeds");
    expect(screen.getByLabelText("Sort order")).toHaveValue(3);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("submits the entered fields to createCategory", async () => {
    vi.mocked(createCategory).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<CategoryForm mode="create" />);

    await user.type(screen.getByLabelText("Category name"), "Compost");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    await screen.findByRole("button", { name: "Create category" });
    const formData = vi.mocked(createCategory).mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Compost");
  });

  it("submits changes to updateCategory bound to the category id in edit mode", async () => {
    vi.mocked(updateCategory).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<CategoryForm mode="edit" category={category} />);

    await user.clear(screen.getByLabelText("Category name"));
    await user.type(screen.getByLabelText("Category name"), "Seeds & Grains");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByRole("button", { name: "Save changes" });
    expect(vi.mocked(updateCategory).mock.calls[0][0]).toBe("cat-1");
    const formData = vi.mocked(updateCategory).mock.calls[0][2] as FormData;
    expect(formData.get("name")).toBe("Seeds & Grains");
  });

  it("shows the server error after a failed submit", async () => {
    vi.mocked(createCategory).mockResolvedValue({ error: "A category with this name already exists." });
    const user = userEvent.setup();
    render(<CategoryForm mode="create" />);

    await user.type(screen.getByLabelText("Category name"), "Seeds");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(await screen.findByText("A category with this name already exists.")).toBeInTheDocument();
  });
});
