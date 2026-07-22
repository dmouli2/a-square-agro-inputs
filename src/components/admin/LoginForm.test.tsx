import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import { login } from "@/app/actions/auth";

vi.mock("@/app/actions/auth", () => ({
  login: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
  });

  it("renders email and password fields and a Sign in button", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the server error after a failed submit", async () => {
    vi.mocked(login).mockResolvedValue({ error: "Invalid email or password." });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "wrong@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "bad-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("submits the entered credentials to the login action", async () => {
    vi.mocked(login).mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "admin@asquareagro.com");
    await user.type(screen.getByPlaceholderText("Password"), "admin123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByRole("button", { name: "Sign in" });
    const formData = vi.mocked(login).mock.calls[0][1] as FormData;
    expect(formData.get("email")).toBe("admin@asquareagro.com");
    expect(formData.get("password")).toBe("admin123");
  });

  it("shows a pending label while the action resolves", async () => {
    let resolveLogin!: (value: { error: string | null }) => void;
    vi.mocked(login).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "Signing in…" })).toBeDisabled();

    resolveLogin({ error: null });
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
