import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./CheckoutForm";
import { placeOrder } from "@/app/actions/checkout";

vi.mock("@/app/actions/checkout", () => ({
  placeOrder: vi.fn(),
}));

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.mocked(placeOrder).mockReset();
  });

  it("renders the delivery detail fields and the COD notice", () => {
    render(<CheckoutForm />);
    expect(screen.getByPlaceholderText("Full name")).toBeRequired();
    expect(screen.getByPlaceholderText("Phone number")).toBeRequired();
    expect(screen.getByPlaceholderText("Email (optional)")).not.toBeRequired();
    expect(screen.getByPlaceholderText("House / street")).toBeRequired();
    expect(screen.getByPlaceholderText("Landmark (optional)")).not.toBeRequired();
    expect(screen.getByPlaceholderText("District")).toBeRequired();
    expect(screen.getByPlaceholderText("State")).toBeRequired();
    expect(screen.getByPlaceholderText("Pincode")).toBeRequired();
    expect(screen.getByText("Cash on Delivery — pay when your order arrives.")).toBeInTheDocument();
  });

  it("shows the server error after a failed submit", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ error: "Your cart is empty." });
    const user = userEvent.setup();
    render(<CheckoutForm />);

    // Required fields must be filled for the form to pass native HTML validation and submit at all.
    await user.type(screen.getByPlaceholderText("Full name"), "Ravi Kumar");
    await user.type(screen.getByPlaceholderText("Phone number"), "9876543210");
    await user.type(screen.getByPlaceholderText("House / street"), "12 Main Road");
    await user.type(screen.getByPlaceholderText("District"), "Salem");
    await user.type(screen.getByPlaceholderText("State"), "Tamil Nadu");
    await user.type(screen.getByPlaceholderText("Pincode"), "636001");
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("submits the entered address fields to placeOrder", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<CheckoutForm />);

    await user.type(screen.getByPlaceholderText("Full name"), "Ravi Kumar");
    await user.type(screen.getByPlaceholderText("Phone number"), "9876543210");
    await user.type(screen.getByPlaceholderText("House / street"), "12 Main Road");
    await user.type(screen.getByPlaceholderText("District"), "Salem");
    await user.type(screen.getByPlaceholderText("State"), "Tamil Nadu");
    await user.type(screen.getByPlaceholderText("Pincode"), "636001");
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    await screen.findByRole("button", { name: "Place order (Cash on Delivery)" });
    const formData = vi.mocked(placeOrder).mock.calls[0][1] as FormData;
    expect(formData.get("fullName")).toBe("Ravi Kumar");
    expect(formData.get("phone")).toBe("9876543210");
    expect(formData.get("pincode")).toBe("636001");
  });

  it("shows a pending label and disables the button while submitting", async () => {
    let resolvePlaceOrder!: (value: { error: string | null }) => void;
    vi.mocked(placeOrder).mockReturnValue(
      new Promise((resolve) => {
        resolvePlaceOrder = resolve;
      })
    );
    const user = userEvent.setup();
    render(<CheckoutForm />);

    await user.type(screen.getByPlaceholderText("Full name"), "Ravi Kumar");
    await user.type(screen.getByPlaceholderText("Phone number"), "9876543210");
    await user.type(screen.getByPlaceholderText("House / street"), "12 Main Road");
    await user.type(screen.getByPlaceholderText("District"), "Salem");
    await user.type(screen.getByPlaceholderText("State"), "Tamil Nadu");
    await user.type(screen.getByPlaceholderText("Pincode"), "636001");
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByRole("button", { name: "Placing order…" })).toBeDisabled();

    resolvePlaceOrder({ error: null });
    expect(await screen.findByRole("button", { name: "Place order (Cash on Delivery)" })).toBeInTheDocument();
  });
});
