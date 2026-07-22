import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductImageGallery } from "./ProductImageGallery";

describe("ProductImageGallery", () => {
  it("shows the brand-initial placeholder when there are no images and no known category", () => {
    render(<ProductImageGallery imageUrls={[]} brandInitial="I" productName="Urea" />);
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a category fallback photo when there are no images but the category is known", () => {
    render(<ProductImageGallery imageUrls={[]} brandInitial="I" productName="Urea" categorySlug="fertilizers" />);
    expect(screen.queryByText("I")).not.toBeInTheDocument();
    expect(screen.getByText(/Representative photo/)).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "Urea" });
    expect(img).toHaveAttribute("src", "/images/categories/fertilizers.jpg");
  });

  it("falls back to the brand-initial placeholder for an unmapped category slug", () => {
    render(<ProductImageGallery imageUrls={[]} brandInitial="I" productName="Urea" categorySlug="seasonal" />);
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("renders a single image without a thumbnail strip", () => {
    render(<ProductImageGallery imageUrls={["/a.jpg"]} brandInitial="I" productName="Urea" />);
    expect(screen.getByRole("img", { name: "Urea" })).toHaveAttribute("src", "/a.jpg");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders thumbnails for multiple images and switches the active image on click", async () => {
    const user = userEvent.setup();
    render(
      <ProductImageGallery imageUrls={["/a.jpg", "/b.jpg", "/c.jpg"]} brandInitial="I" productName="Urea" />
    );

    expect(screen.getByRole("img", { name: "Urea" })).toHaveAttribute("src", "/a.jpg");
    const thumbnails = screen.getAllByRole("button");
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveClass("border-primary-600");

    await user.click(thumbnails[1]);
    expect(screen.getByRole("img", { name: "Urea" })).toHaveAttribute("src", "/b.jpg");
    expect(thumbnails[1]).toHaveClass("border-primary-600");
    expect(thumbnails[0]).not.toHaveClass("border-primary-600");
  });
});
