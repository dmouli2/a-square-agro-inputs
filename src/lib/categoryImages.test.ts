import { describe, it, expect } from "vitest";
import { getCategoryFallbackImage } from "./categoryImages";

describe("getCategoryFallbackImage", () => {
  it("returns the mapped image path for a known category slug", () => {
    expect(getCategoryFallbackImage("seeds")).toBe("/images/categories/seeds.jpg");
    expect(getCategoryFallbackImage("fertilizers")).toBe("/images/categories/fertilizers.jpg");
    expect(getCategoryFallbackImage("crop-protection")).toBe("/images/categories/crop-protection.jpg");
    expect(getCategoryFallbackImage("tools-equipment")).toBe("/images/categories/tools-equipment.jpg");
  });

  it("returns null for an unmapped category slug", () => {
    expect(getCategoryFallbackImage("seasonal-offers")).toBeNull();
  });

  it("returns null when no slug is given", () => {
    expect(getCategoryFallbackImage(undefined)).toBeNull();
    expect(getCategoryFallbackImage(null)).toBeNull();
  });
});
