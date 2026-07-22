import { describe, it, expect } from "vitest";
import { makeOrder } from "@/test/fixtures";
import { STORE_WHATSAPP_NUMBER, buildWaLink, customerWaNumber, statusUpdateMessage } from "./whatsapp";

describe("buildWaLink", () => {
  it("builds a wa.me URL with the message URL-encoded", () => {
    const link = buildWaLink("916374597757", "Hello & welcome");
    expect(link).toBe("https://wa.me/916374597757?text=Hello%20%26%20welcome");
  });
});

describe("customerWaNumber", () => {
  it("prefixes the Indian country code onto a 10-digit number", () => {
    expect(customerWaNumber("9876543210")).toBe("919876543210");
  });
});

describe("statusUpdateMessage", () => {
  it("greets the customer by name and references the order id", () => {
    const message = statusUpdateMessage(makeOrder());
    expect(message).toContain("Hi Ramesh Kumar");
    expect(message).toContain("#ORD-1");
  });

  it.each([
    ["pending", /call you shortly to confirm/],
    ["confirmed", /confirmed and is being prepared/],
    ["packed", /packed and ready for dispatch/],
    ["shipped", /shipped and is on its way/],
    ["delivered", /has been delivered/],
    ["cancelled", /has been cancelled/],
    ["returned", /marked as returned/],
  ] as const)("has a specific line for the %s status", (status, expected) => {
    expect(statusUpdateMessage(makeOrder({ status }))).toMatch(expected);
  });
});

describe("STORE_WHATSAPP_NUMBER", () => {
  it("is the store number in international format without a plus", () => {
    expect(STORE_WHATSAPP_NUMBER).toMatch(/^91\d{10}$/);
  });
});
