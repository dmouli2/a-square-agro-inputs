import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProductLoading from "./loading";

describe("ProductLoading", () => {
  it("renders the skeleton layout without crashing", () => {
    const { container } = render(<ProductLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
