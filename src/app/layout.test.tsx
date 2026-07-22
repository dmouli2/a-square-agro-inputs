import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata, viewport } from "./layout";

describe("RootLayout", () => {
  it("renders children inside the html/body shell", () => {
    render(
      <RootLayout>
        <p>child content</p>
      </RootLayout>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("exports site metadata and viewport config", () => {
    expect(metadata.title).toEqual(
      expect.objectContaining({ default: expect.stringContaining("A Square Agro Inputs") })
    );
    expect(metadata.manifest).toBe("/manifest.json");
    expect(viewport.themeColor).toBe("#159949");
  });
});
