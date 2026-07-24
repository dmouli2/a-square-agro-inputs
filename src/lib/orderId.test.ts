import { describe, it, expect } from "vitest";
import { shortOrderId } from "./orderId";

describe("shortOrderId", () => {
  it("truncates a uuid to its first hyphen-delimited segment", () => {
    expect(shortOrderId("44f50510-49e7-45d9-8797-bac70ae94e30")).toBe("44f50510");
  });

  it("returns short ids unchanged", () => {
    expect(shortOrderId("ORD-1")).toBe("ORD-1");
    expect(shortOrderId("ORD-20")).toBe("ORD-20");
  });
});
