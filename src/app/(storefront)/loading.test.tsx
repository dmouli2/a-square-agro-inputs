import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HomeLoading from "./loading";

describe("HomeLoading", () => {
  it("renders the skeleton layout without crashing", () => {
    const { container } = render(<HomeLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
