import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Urea 46% N Fertiliser")).toBe("urea-46-n-fertiliser");
  });

  it("collapses runs of non-alphanumeric characters into a single hyphen", () => {
    expect(slugify("NPK  19:19:19 --- Mix")).toBe("npk-19-19-19-mix");
  });

  it("trims leading and trailing hyphens produced by punctuation at the edges", () => {
    expect(slugify("  -Hybrid Maize Seed-  ")).toBe("hybrid-maize-seed");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
