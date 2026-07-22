import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CartLoading from "./loading";

describe("CartLoading", () => {
  it("renders the skeleton layout without crashing", () => {
    const { container } = render(<CartLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
