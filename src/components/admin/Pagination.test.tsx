import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} basePath="/admin/products" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total, with only a working Next link on page 1", () => {
    render(<Pagination page={1} totalPages={3} basePath="/admin/products" />);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/products?page=2");
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
  });

  it("shows a working Previous link and no Next link on the last page", () => {
    render(<Pagination page={3} totalPages={3} basePath="/admin/products" />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/admin/products?page=2");
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });

  it("omits ?page= entirely when linking back to page 1", () => {
    render(<Pagination page={2} totalPages={3} basePath="/admin/products" />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/admin/products");
  });

  it("preserves other search params (e.g. a search query) across page links", () => {
    render(
      <Pagination
        page={2}
        totalPages={3}
        basePath="/admin/products"
        searchParams={{ q: "seed" }}
      />
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/products?q=seed&page=3");
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/admin/products?q=seed");
  });

  it("drops an empty search param instead of leaving a dangling '='", () => {
    render(
      <Pagination page={1} totalPages={2} basePath="/admin/products" searchParams={{ q: "" }} />
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/products?page=2");
  });
});
