import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShopBrowser } from "./ShopBrowser";
import { CartCountProvider } from "./CartCountContext";
import { makeCategory, makeProduct } from "@/test/fixtures";
import type { Category, ProductWithVariants } from "@/types";

vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn(),
  updateCartQuantity: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getImageStorage: () => ({
    getPublicUrl: (path: string) => `https://cdn.example.com/${path}`,
  }),
}));

const categories: Category[] = [
  makeCategory({ id: "cat-seeds", slug: "seeds", name: "Seeds" }),
  makeCategory({ id: "cat-fert", slug: "fertilizers", name: "Fertilizers" }),
];

const products: ProductWithVariants[] = [
  makeProduct({ id: "p1", slug: "hybrid-seed", name: "Hybrid Maize Seed", categoryId: "cat-seeds" }),
  makeProduct({ id: "p2", slug: "urea", name: "Urea 46%", brand: "IFFCO", categoryId: "cat-fert" }),
];

function renderBrowser(props: Partial<React.ComponentProps<typeof ShopBrowser>> = {}) {
  return render(
    <CartCountProvider initialCount={0}>
      <ShopBrowser categories={categories} products={products} cart={{}} {...props} />
    </CartCountProvider>
  );
}

describe("ShopBrowser", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/shop");
  });

  it("shows every product when no category is selected", () => {
    renderBrowser();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
  });

  it("filters to just that category's products on pill click, with no network call", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Fertilizers" }));

    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
    expect(screen.queryByText("Hybrid Maize Seed")).not.toBeInTheDocument();
  });

  it("returns to the full list when All is clicked again", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Fertilizers" }));
    expect(screen.queryByText("Hybrid Maize Seed")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Urea 46%")).toBeInTheDocument();
  });

  it("marks the active pill with aria-current", async () => {
    const user = userEvent.setup();
    renderBrowser();

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Seeds" }));
    expect(screen.getByRole("button", { name: "Seeds" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "All" })).not.toHaveAttribute("aria-current");
  });

  it("starts filtered when initialCategory is provided (matches a direct/bookmarked URL)", () => {
    renderBrowser({ initialCategory: "seeds" });
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.queryByText("Urea 46%")).not.toBeInTheDocument();
  });

  it("updates the URL via the History API on pill click, without a Next.js navigation", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Fertilizers" }));
    expect(window.location.pathname + window.location.search).toBe("/shop?category=fertilizers");
  });

  it("shows the empty state when a category has no matching products", async () => {
    const user = userEvent.setup();
    renderBrowser({ categories: [...categories, makeCategory({ id: "cat-empty", slug: "tools", name: "Tools" })] });

    await user.click(screen.getByRole("button", { name: "Tools" }));
    expect(screen.getByText("No products in this category yet.")).toBeInTheDocument();
  });
});
