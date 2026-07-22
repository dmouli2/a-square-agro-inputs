import { describe, it, expect } from "vitest";
import { CATEGORIES, PRODUCTS } from "./mock-data";

describe("mock-data", () => {
  it("every category has a unique slug", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every product references a real category", () => {
    const categoryIds = new Set(CATEGORIES.map((c) => c.id));
    for (const product of PRODUCTS) {
      expect(categoryIds.has(product.categoryId)).toBe(true);
    }
  });

  it("every product has at least one variant, and every variant id is unique", () => {
    const variantIds: string[] = [];
    for (const product of PRODUCTS) {
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.productId).toBe(product.id);
        variantIds.push(variant.id);
      }
    }
    expect(new Set(variantIds).size).toBe(variantIds.length);
  });
});
