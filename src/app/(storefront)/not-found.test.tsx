import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StorefrontNotFound from "./not-found";

describe("StorefrontNotFound", () => {
  it("renders a not-found message with a link back to the shop", () => {
    render(<StorefrontNotFound />);
    expect(screen.getByText("We couldn't find that page")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Browse products" });
    expect(link).toHaveAttribute("href", "/shop");
  });
});
