import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandMarquee } from "./BrandMarquee";

describe("BrandMarquee", () => {
  it("renders nothing with fewer than 3 unique brands", () => {
    const { container } = render(<BrandMarquee brands={["IFFCO", "IFFCO", "Tata Rallis"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when given an empty list", () => {
    const { container } = render(<BrandMarquee brands={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("dedupes brand names (each shown twice: once live, once as the aria-hidden loop copy)", () => {
    render(<BrandMarquee brands={["Tata Rallis", "IFFCO", "IFFCO", "Bayer"]} />);
    expect(screen.getAllByText("IFFCO", { exact: true }).length).toBe(2);
    expect(screen.getAllByText("Bayer").length).toBe(2);
    expect(screen.getAllByText("Tata Rallis").length).toBe(2);
  });

  it("marks the duplicated loop copy as aria-hidden so screen readers only hear the list once", () => {
    render(<BrandMarquee brands={["Bayer", "IFFCO", "Tata Rallis"]} />);
    expect(screen.getByLabelText(/Brands we stock: Bayer, IFFCO, Tata Rallis/)).toBeInTheDocument();
  });
});
