import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppButton } from "./WhatsAppButton";

describe("WhatsAppButton", () => {
  it("links to wa.me with the encoded default message", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link", { name: "Chat with us on WhatsApp" });
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/916374597757?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20your%20products."
    );
  });

  it("opens in a new tab safely", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link", { name: "Chat with us on WhatsApp" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
