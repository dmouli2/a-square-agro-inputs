import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "./ProductForm";
import { createProduct, updateProduct } from "@/app/actions/products";
import type { Category, Product } from "@/types";

vi.mock("@/app/actions/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

const categories: Category[] = [
  { id: "cat-1", slug: "seeds", name: "Seeds" },
  { id: "cat-2", slug: "fertilizers", name: "Fertilizers" },
];

const product: Product = {
  id: "prod-1",
  slug: "urea-50kg",
  name: "Urea",
  brand: "IFFCO",
  categoryId: "cat-2",
  description: "A nitrogen fertilizer",
  images: [],
  status: "active",
  cropCompatibility: ["Paddy", "Cotton"],
  isBestseller: true,
};

// ProductForm's <label> elements aren't associated with their inputs via
// htmlFor/id, so we query by the `name` attribute instead of getByLabelText.
function field(container: HTMLElement, name: string) {
  return container.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}

describe("ProductForm", () => {
  beforeEach(() => {
    vi.mocked(createProduct).mockReset();
    vi.mocked(updateProduct).mockReset();
  });

  it("renders empty fields and the first-pack-size section in create mode", () => {
    const { container } = render(<ProductForm categories={categories} mode="create" />);
    expect(field(container, "name")).toHaveValue("");
    expect(field(container, "brand")).toHaveValue("");
    expect(screen.getByText("First pack size")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create product" })).toBeInTheDocument();
  });

  it("lists all categories as options", () => {
    render(<ProductForm categories={categories} mode="create" />);
    expect(screen.getByRole("option", { name: "Seeds" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fertilizers" })).toBeInTheDocument();
  });

  it("renders prefilled fields and hides the pack-size section in edit mode", () => {
    const { container } = render(<ProductForm categories={categories} mode="edit" product={product} />);
    expect(field(container, "name")).toHaveValue("Urea");
    expect(field(container, "brand")).toHaveValue("IFFCO");
    expect(field(container, "cropCompatibility")).toHaveValue("Paddy, Cotton");
    expect(screen.queryByText("First pack size")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("shows the server error after a failed create submit", async () => {
    vi.mocked(createProduct).mockResolvedValue({ error: "Something went wrong creating the product." });
    const user = userEvent.setup();
    const { container } = render(<ProductForm categories={categories} mode="create" />);

    // Required fields must be filled for the form to pass native HTML validation and submit at all.
    await user.type(field(container, "name"), "Neem Oil");
    await user.type(field(container, "brand"), "Godrej");
    await user.selectOptions(field(container, "categoryId"), "cat-1");
    await user.type(field(container, "variantLabel"), "500 ml");
    await user.type(field(container, "variantSku"), "NEEM-500");
    await user.type(field(container, "variantPrice"), "199");
    await user.type(field(container, "variantMrp"), "249");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(
      await screen.findByText("Something went wrong creating the product.")
    ).toBeInTheDocument();
  });

  it("submits the entered fields to createProduct", async () => {
    vi.mocked(createProduct).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    const { container } = render(<ProductForm categories={categories} mode="create" />);

    await user.type(field(container, "name"), "Neem Oil");
    await user.type(field(container, "brand"), "Godrej");
    await user.selectOptions(field(container, "categoryId"), "cat-1");
    await user.click(screen.getByRole("checkbox"));
    await user.type(field(container, "variantLabel"), "500 ml");
    await user.type(field(container, "variantSku"), "NEEM-500");
    await user.type(field(container, "variantPrice"), "199");
    await user.type(field(container, "variantMrp"), "249");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    await screen.findByRole("button", { name: "Create product" });
    const formData = vi.mocked(createProduct).mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Neem Oil");
    expect(formData.get("brand")).toBe("Godrej");
    expect(formData.get("categoryId")).toBe("cat-1");
    expect(formData.get("isBestseller")).toBe("on");
    expect(formData.get("variantSku")).toBe("NEEM-500");
  });

  it("submits changes to updateProduct bound to the product id in edit mode", async () => {
    vi.mocked(updateProduct).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    const { container } = render(<ProductForm categories={categories} mode="edit" product={product} />);

    await user.clear(field(container, "name"));
    await user.type(field(container, "name"), "Urea Prilled");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByRole("button", { name: "Save changes" });
    expect(updateProduct).toHaveBeenCalledWith(
      "prod-1",
      expect.anything(),
      expect.any(FormData)
    );
  });

  it("shows a saving label while the update action resolves", async () => {
    let resolveUpdate!: (value: { error: string | null }) => void;
    vi.mocked(updateProduct).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const user = userEvent.setup();
    render(<ProductForm categories={categories} mode="edit" product={product} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();

    resolveUpdate({ error: null });
    expect(await screen.findByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
