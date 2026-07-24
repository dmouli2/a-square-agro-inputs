import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRevalidatePath } from "../../../vitest.setup";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { updateOrderStatus } from "./adminOrders";
import type { Staff } from "@/types";

vi.mock("@/lib/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const admin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

function formData(status: string): FormData {
  const fd = new FormData();
  fd.set("status", status);
  return fd;
}

const prevState = { error: null, status: "pending" as const };

describe("updateOrderStatus", () => {
  const updateStatus = vi.fn();

  beforeEach(() => {
    updateStatus.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ orders: { updateStatus } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role before doing anything else", async () => {
    await updateOrderStatus("o1", prevState, formData("confirmed"));
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("updates the order for every valid status value", async () => {
    for (const status of ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"]) {
      updateStatus.mockClear();
      await updateOrderStatus("o1", prevState, formData(status));
      expect(updateStatus).toHaveBeenCalledWith("o1", status);
    }
  });

  it("ignores an unrecognized status value without touching the database", async () => {
    await updateOrderStatus("o1", prevState, formData("shipped-and-lost"));
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it("revalidates the order list and the order's own detail page on success", async () => {
    await updateOrderStatus("o1", prevState, formData("confirmed"));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/orders/o1");
  });

  it("does not revalidate anything for a rejected status", async () => {
    await updateOrderStatus("o1", prevState, formData("bogus"));
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns the new status on success and an error message with the prior status on rejection", async () => {
    const success = await updateOrderStatus("o1", prevState, formData("confirmed"));
    expect(success).toEqual({ error: null, status: "confirmed" });

    const rejected = await updateOrderStatus("o1", prevState, formData("bogus"));
    expect(rejected).toEqual({ error: "Invalid status.", status: "pending" });
  });
});
