import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderStatusForm } from "./OrderStatusForm";
import { updateOrderStatus } from "@/app/actions/adminOrders";

vi.mock("@/app/actions/adminOrders", () => ({
  updateOrderStatus: vi.fn(),
}));

describe("OrderStatusForm", () => {
  beforeEach(() => {
    vi.mocked(updateOrderStatus).mockReset();
  });

  it("renders the current status selected and an Update button", () => {
    render(<OrderStatusForm orderId="o1" initialStatus="confirmed" />);
    expect(screen.getByRole("combobox")).toHaveValue("confirmed");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("reflects the confirmed status returned by the action after a successful update", async () => {
    let resolveAction!: (value: { error: string | null; status: string }) => void;
    vi.mocked(updateOrderStatus).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }) as never
    );
    const user = userEvent.setup();
    render(<OrderStatusForm orderId="o1" initialStatus="confirmed" />);

    await user.selectOptions(screen.getByRole("combobox"), "packed");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByRole("button", { name: "Updating…" })).toBeDisabled();

    resolveAction({ error: null, status: "packed" });

    await screen.findByRole("button", { name: "Update" });
    expect(screen.getByRole("combobox")).toHaveValue("packed");
  });

  it("snaps the dropdown back to the prior status and shows an error on a rejected update", async () => {
    vi.mocked(updateOrderStatus).mockResolvedValue({ error: "Invalid status.", status: "confirmed" });
    const user = userEvent.setup();
    render(<OrderStatusForm orderId="o1" initialStatus="confirmed" />);

    await user.selectOptions(screen.getByRole("combobox"), "packed");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("Invalid status.")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("confirmed");
  });

  it("disables Update until a different status is picked", async () => {
    const user = userEvent.setup();
    render(<OrderStatusForm orderId="o1" initialStatus="confirmed" />);

    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox"), "packed");
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  });
});
