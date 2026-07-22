import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/actions/auth", () => ({
  login: vi.fn(),
}));

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("renders the sign-in form with the logo and heading", () => {
    render(<AdminLoginPage />);

    expect(screen.getByText("Admin sign in")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
