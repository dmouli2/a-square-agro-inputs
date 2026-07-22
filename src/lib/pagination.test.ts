import { describe, it, expect } from "vitest";
import { parsePage, paginate, PAGE_SIZE } from "./pagination";

describe("parsePage", () => {
  it("defaults to page 1 for undefined, non-numeric, zero or negative input", () => {
    expect(parsePage(undefined, 100)).toBe(1);
    expect(parsePage("abc", 100)).toBe(1);
    expect(parsePage("0", 100)).toBe(1);
    expect(parsePage("-3", 100)).toBe(1);
  });

  it("rejects a fractional page number", () => {
    expect(parsePage("1.5", 100)).toBe(1);
  });

  it("passes through a valid in-range page", () => {
    expect(parsePage("2", 100, 20)).toBe(2);
  });

  it("clamps a page beyond the last page down to the last page", () => {
    expect(parsePage("99", 45, 20)).toBe(3);
  });

  it("clamps to page 1 when there are zero items", () => {
    expect(parsePage("5", 0, 20)).toBe(1);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  it("returns the first page slice with correct metadata", () => {
    const result = paginate(items, 1, 20);
    expect(result.items).toEqual(items.slice(0, 20));
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.totalItems).toBe(45);
  });

  it("returns the last, partial page", () => {
    const result = paginate(items, 3, 20);
    expect(result.items).toEqual([41, 42, 43, 44, 45]);
  });

  it("uses the default page size when not specified", () => {
    const result = paginate(items, 1);
    expect(result.items).toHaveLength(PAGE_SIZE);
  });

  it("reports a single total page for an empty list", () => {
    const result = paginate([], 1, 20);
    expect(result.totalPages).toBe(1);
    expect(result.items).toEqual([]);
  });
});
