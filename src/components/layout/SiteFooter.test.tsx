import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the brand name, shop links and current year copyright", () => {
    render(<SiteFooter />);
    expect(screen.getByText("A Square Agro Inputs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seeds" })).toHaveAttribute("href", "/shop?category=seeds");
    expect(screen.getByRole("link", { name: "Fertilizers" })).toHaveAttribute(
      "href",
      "/shop?category=fertilizers"
    );
    expect(screen.getByRole("link", { name: "Crop Protection" })).toHaveAttribute(
      "href",
      "/shop?category=crop-protection"
    );
    expect(screen.getByRole("link", { name: "Tools & Equipment" })).toHaveAttribute(
      "href",
      "/shop?category=tools-equipment"
    );

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year} A Square Agro Inputs`))).toBeInTheDocument();
  });
});
