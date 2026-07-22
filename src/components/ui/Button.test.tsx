import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ButtonLink } from "./Button";

describe("Button", () => {
  it("renders children and defaults to primary/md classes", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toHaveClass("bg-primary-700");
    expect(btn).toHaveClass("h-11");
  });

  it("applies accent, secondary and ghost variant classes", () => {
    const { rerender } = render(<Button variant="accent">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-accent-500");

    rerender(<Button variant="secondary">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-surface");

    rerender(<Button variant="ghost">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-primary-50");
  });

  it("applies sm and lg size classes", () => {
    const { rerender } = render(<Button size="sm">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="lg">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-13");
  });

  it("merges a custom className and forwards native button props", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button className="custom-class" onClick={onClick} disabled>
        A
      </Button>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("custom-class");
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when enabled and clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>A</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("ButtonLink", () => {
  it("renders a link with the right href and variant/size classes", () => {
    render(
      <ButtonLink href="/cart" variant="secondary" size="lg">
        Go to cart
      </ButtonLink>
    );
    const link = screen.getByRole("link", { name: "Go to cart" });
    expect(link).toHaveAttribute("href", "/cart");
    expect(link).toHaveClass("bg-surface");
    expect(link).toHaveClass("h-13");
  });

  it("defaults to primary/md classes and merges a custom className", () => {
    render(
      <ButtonLink href="/shop" className="extra">
        Shop
      </ButtonLink>
    );
    const link = screen.getByRole("link", { name: "Shop" });
    expect(link).toHaveClass("bg-primary-700");
    expect(link).toHaveClass("h-11");
    expect(link).toHaveClass("extra");
  });
});
