import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./CheckoutForm";
import { placeOrder } from "@/app/actions/checkout";

vi.mock("@/app/actions/checkout", () => ({
  placeOrder: vi.fn(),
}));

async function fillValidAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "Ravi Kumar");
  await user.type(screen.getByLabelText("Phone number"), "9876543210");
  await user.type(screen.getByLabelText("House / street"), "12 Main Road");
  await user.selectOptions(screen.getByLabelText("State"), "Tamil Nadu");
  await user.selectOptions(screen.getByLabelText("District"), "Salem");
  await user.type(screen.getByLabelText("Pincode"), "636001");
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.mocked(placeOrder).mockReset();
  });

  it("renders sectioned delivery fields, the order summary, and the COD/trust notices", () => {
    render(<CheckoutForm subtotal={1240} />);

    expect(screen.getByText("Delivery details")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeRequired();
    expect(screen.getByLabelText("Phone number")).toBeRequired();
    expect(screen.getByLabelText("Email (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("House / street")).toBeRequired();
    expect(screen.getByLabelText("Landmark (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("Village / town (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("State")).toBeRequired();
    expect(screen.getByLabelText("District")).toBeRequired();
    expect(screen.getByLabelText("Pincode")).toBeRequired();

    expect(screen.getByText("Order summary")).toBeInTheDocument();
    expect(screen.getAllByText("₹1,240").length).toBeGreaterThan(0);
    expect(screen.getByText("Free")).toBeInTheDocument();

    expect(screen.getByText("Cash on Delivery — pay when it arrives.")).toBeInTheDocument();
    expect(screen.getByText("Doorstep delivery, even to your village.")).toBeInTheDocument();
    expect(screen.getByText("Your details are only used to deliver this order.")).toBeInTheDocument();
  });

  it("only lists real Indian states, and disables the district select until a state is chosen", () => {
    render(<CheckoutForm subtotal={500} />);

    const stateSelect = screen.getByLabelText("State") as HTMLSelectElement;
    const stateOptions = Array.from(stateSelect.options).map((o) => o.value).filter(Boolean);
    expect(stateOptions).toContain("Tamil Nadu");
    expect(stateOptions).toContain("Kerala");
    expect(stateOptions).toHaveLength(36);

    expect(screen.getByLabelText("District")).toBeDisabled();
  });

  it("populates the district dropdown for the chosen state, and resets it if the state changes", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.selectOptions(screen.getByLabelText("State"), "Tamil Nadu");
    const districtSelect = screen.getByLabelText("District") as HTMLSelectElement;
    expect(districtSelect).not.toBeDisabled();
    const tnDistricts = Array.from(districtSelect.options).map((o) => o.value).filter(Boolean);
    expect(tnDistricts).toContain("Chennai");
    expect(tnDistricts).not.toContain("Ernakulam");

    await user.selectOptions(districtSelect, "Chennai");
    expect(districtSelect).toHaveValue("Chennai");

    await user.selectOptions(screen.getByLabelText("State"), "Kerala");
    expect(districtSelect).toHaveValue("");
    const keralaDistricts = Array.from(districtSelect.options).map((o) => o.value).filter(Boolean);
    expect(keralaDistricts).toContain("Ernakulam");
  });

  it("shows an inline error the moment an invalid phone number is blurred, without waiting for submit", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    const phone = screen.getByLabelText("Phone number");
    await user.type(phone, "12345");
    await user.tab();

    expect(await screen.findByText("Enter a valid 10-digit phone number.")).toBeInTheDocument();
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("accepts a valid 6-digit pincode on blur without showing an error", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.type(screen.getByLabelText("Pincode"), "636001");
    await user.tab();

    expect(screen.queryByText("Enter a valid 6-digit pincode.")).not.toBeInTheDocument();
  });

  it("clears the inline error once the field is corrected", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    const phone = screen.getByLabelText("Phone number");
    await user.type(phone, "12345");
    await user.tab();
    expect(await screen.findByText("Enter a valid 10-digit phone number.")).toBeInTheDocument();

    await user.clear(phone);
    await user.type(phone, "9876543210");
    await user.tab();

    expect(screen.queryByText("Enter a valid 10-digit phone number.")).not.toBeInTheDocument();
  });

  it.each([
    ["Full name", "Enter your full name."],
    ["Phone number", "Enter your phone number."],
    ["House / street", "Enter your house / street address."],
    ["State", "Enter your state."],
    ["Pincode", "Enter your pincode."],
  ])("flags %s left empty on blur", async (label, message) => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.click(screen.getByLabelText(label));
    await user.tab();

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("flags District left empty on blur, once a state has made it selectable", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.selectOptions(screen.getByLabelText("State"), "Tamil Nadu");
    await user.click(screen.getByLabelText("District"));
    await user.tab();

    expect(await screen.findByText("Enter your district.")).toBeInTheDocument();
  });

  it("catches an invalid untouched field on submit without needing a server round trip", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    // Fill every required field via keyboard/selection except pincode, which is set via
    // fireEvent so it's never focused/blurred by this test — submit's own full-form check
    // (handleSubmit) must catch the bad pincode itself, without placeOrder ever running.
    await user.type(screen.getByLabelText("Full name"), "Ravi Kumar");
    await user.type(screen.getByLabelText("Phone number"), "9876543210");
    await user.type(screen.getByLabelText("House / street"), "12 Main Road");
    await user.selectOptions(screen.getByLabelText("State"), "Tamil Nadu");
    await user.selectOptions(screen.getByLabelText("District"), "Salem");
    fireEvent.change(screen.getByLabelText("Pincode"), { target: { value: "63600" } });
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByText("Enter a valid 6-digit pincode.")).toBeInTheDocument();
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("scrolls to and focuses the first empty required field when submitted blank", async () => {
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("surfaces a server-side field error for a validation the client doesn't replicate", async () => {
    vi.mocked(placeOrder).mockResolvedValue({
      error: "Please fix the highlighted fields below.",
      fieldErrors: { pincode: "We don't currently deliver to this pincode." },
    });
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await user.type(screen.getByLabelText("Full name"), "Ravi Kumar");
    await user.type(screen.getByLabelText("Phone number"), "9876543210");
    await user.type(screen.getByLabelText("House / street"), "12 Main Road");
    await user.selectOptions(screen.getByLabelText("State"), "Tamil Nadu");
    await user.selectOptions(screen.getByLabelText("District"), "Salem");
    // Set via fireEvent (not user.type), so this field is never blurred/touched locally.
    // It's syntactically valid, so handleSubmit's own check lets the submission through,
    // and only the server's fieldErrors can surface a non-format problem with it.
    fireEvent.change(screen.getByLabelText("Pincode"), { target: { value: "636001" } });
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByText("We don't currently deliver to this pincode.")).toBeInTheDocument();
  });

  it("shows the server error banner after a failed submit", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ error: "Your cart is empty." });
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await fillValidAddress(user);
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your cart is empty.");
  });

  it("submits the entered address fields to placeOrder", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<CheckoutForm subtotal={500} />);

    await fillValidAddress(user);
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    await screen.findByRole("button", { name: "Place order (Cash on Delivery)" });
    const formData = vi.mocked(placeOrder).mock.calls[0][1] as FormData;
    expect(formData.get("fullName")).toBe("Ravi Kumar");
    expect(formData.get("phone")).toBe("9876543210");
    expect(formData.get("state")).toBe("Tamil Nadu");
    expect(formData.get("district")).toBe("Salem");
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
    render(<CheckoutForm subtotal={500} />);

    await fillValidAddress(user);
    await user.click(screen.getByRole("button", { name: "Place order (Cash on Delivery)" }));

    expect(await screen.findByRole("button", { name: "Placing order…" })).toBeDisabled();

    resolvePlaceOrder({ error: null });
    expect(await screen.findByRole("button", { name: "Place order (Cash on Delivery)" })).toBeInTheDocument();
  });
});
