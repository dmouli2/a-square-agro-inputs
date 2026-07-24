import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the hero immediately, with no data-fetching dependency", () => {
    render(<HomePage />);
    expect(screen.getByText("From the soil up, everything your fields need.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop now" })).toBeInTheDocument();
  });

  it("shows the catalog skeleton while HomeCatalogSections is pending, instead of blocking the whole page", () => {
    render(<HomePage />);
    // The real catalog content (fed by Supabase) hasn't resolved in this render, so only
    // the Suspense fallback's skeleton placeholders should be present.
    expect(screen.queryByText("Popular right now")).not.toBeInTheDocument();
    expect(screen.queryByText("Shop by category")).not.toBeInTheDocument();
  });

  it("renders the how-it-works steps", () => {
    render(<HomePage />);
    expect(screen.getByText("From your cart to your courtyard")).toBeInTheDocument();
    expect(screen.getByText("Pick what your field needs")).toBeInTheDocument();
    expect(screen.getByText("Delivered to your doorstep, pay on arrival")).toBeInTheDocument();
  });

  it("renders the farmer promise section", () => {
    render(<HomePage />);
    expect(screen.getByText("A Square Farmer Promise")).toBeInTheDocument();
    expect(screen.getByText("Every product checked for genuine certification before it's listed")).toBeInTheDocument();
  });
});
