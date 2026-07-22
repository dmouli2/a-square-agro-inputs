import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ShopLoading from "./loading";

describe("ShopLoading", () => {
  it("renders the skeleton layout without crashing", () => {
    const { container } = render(<ShopLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
