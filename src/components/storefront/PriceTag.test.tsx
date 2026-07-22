import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceTag } from "./PriceTag";

describe("PriceTag", () => {
  it("renders just the price when no mrp is given", () => {
    render(<PriceTag price={499} />);
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("does not show a discount when mrp equals price", () => {
    render(<PriceTag price={499} mrp={499} />);
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("shows the struck-through mrp and percent off when mrp exceeds price", () => {
    render(<PriceTag price={750} mrp={1000} />);
    expect(screen.getByText("₹750")).toBeInTheDocument();
    expect(screen.getByText("₹1,000")).toBeInTheDocument();
    expect(screen.getByText("25% off")).toBeInTheDocument();
  });

  it("rounds the discount percentage", () => {
    render(<PriceTag price={299} mrp={399} />);
    // (399-299)/399 = 25.06% -> rounds to 25%
    expect(screen.getByText("25% off")).toBeInTheDocument();
  });
});
