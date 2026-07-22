import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSidebar, AdminMobileNav } from "./AdminNav";
import { logout } from "@/app/actions/auth";

const pathnameState = vi.hoisted(() => ({ value: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/app/actions/auth", () => ({
  logout: vi.fn(),
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    pathnameState.value = "/admin";
  });

  it("renders nav items, the staff name and marks the exact dashboard route active", () => {
    render(<AdminSidebar staffName="Priya" />);
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveClass("bg-primary-700");
    expect(screen.getByRole("link", { name: /Products/ })).not.toHaveClass("bg-primary-700");
    expect(screen.getByRole("link", { name: /Orders/ })).not.toHaveClass("bg-primary-700");
  });

  it("marks a prefix-matched route (non-exact) active", () => {
    pathnameState.value = "/admin/products/123/edit";
    render(<AdminSidebar staffName="Priya" />);
    expect(screen.getByRole("link", { name: /Products/ })).toHaveClass("bg-primary-700");
    expect(screen.getByRole("link", { name: /Dashboard/ })).not.toHaveClass("bg-primary-700");
  });

  it("does not mark the dashboard link active for a route it only prefixes loosely", () => {
    pathnameState.value = "/admin/orders";
    render(<AdminSidebar staffName="Priya" />);
    expect(screen.getByRole("link", { name: /Dashboard/ })).not.toHaveClass("bg-primary-700");
    expect(screen.getByRole("link", { name: /Orders/ })).toHaveClass("bg-primary-700");
  });

  it("submits the logout action when Sign out is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminSidebar staffName="Priya" />);
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(logout).toHaveBeenCalled();
  });
});

describe("AdminMobileNav", () => {
  beforeEach(() => {
    pathnameState.value = "/admin/orders";
  });

  it("renders nav items and marks the active route", () => {
    render(<AdminMobileNav />);
    expect(screen.getByRole("link", { name: /Orders/ })).toHaveClass("bg-primary-700");
    expect(screen.getByRole("link", { name: /Products/ })).not.toHaveClass("bg-primary-700");
  });

  it("submits the logout action when Sign out is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(logout).toHaveBeenCalled();
  });
});
