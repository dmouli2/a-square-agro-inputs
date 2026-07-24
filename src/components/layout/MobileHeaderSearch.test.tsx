import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileHeaderSearch } from "./MobileHeaderSearch";
import { CartCountProvider } from "@/components/storefront/CartCountContext";

function renderSearch(cartCount = 0) {
  return render(
    <CartCountProvider initialCount={cartCount}>
      <MobileHeaderSearch />
    </CartCountProvider>
  );
}

describe("MobileHeaderSearch", () => {
  it("shows the logo, search and cart icons by default with no cart badge", () => {
    renderSearch();
    expect(screen.getByText("A Square")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("shows a cart badge with the count when cartCount is positive", () => {
    renderSearch(2);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("switches to the search form when the search icon is clicked and focuses the input", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: "Open search" }));

    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByRole("search")).toHaveAttribute("action", "/shop");
    expect(screen.queryByText("A Square")).not.toBeInTheDocument();
  });

  it("returns to the default view when the back button is clicked", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: "Open search" }));
    await user.click(screen.getByRole("button", { name: "Close search" }));

    expect(screen.getByText("A Square")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
