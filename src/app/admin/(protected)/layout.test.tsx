import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { requireRole } from "@/lib/dal";
import AdminProtectedLayout from "./layout";
import type { Staff } from "@/types";

vi.mock("@/lib/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/components/admin/AdminNav", () => ({
  AdminSidebar: ({ staffName }: { staffName: string }) => <nav data-testid="sidebar">{staffName}</nav>,
  AdminMobileNav: () => <nav data-testid="mobile-nav" />,
}));

const admin: Staff = { id: "s1", name: "Admin User", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

describe("AdminProtectedLayout", () => {
  it("requires the admin role before rendering, and passes the staff name to the sidebar", async () => {
    vi.mocked(requireRole).mockResolvedValue(admin);
    const element = await AdminProtectedLayout({ children: <p>page content</p> });
    render(element);
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
    expect(screen.getByTestId("sidebar")).toHaveTextContent("Admin User");
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("propagates the redirect thrown by requireRole when the caller isn't an admin", async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(AdminProtectedLayout({ children: <p>page content</p> })).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });
});
