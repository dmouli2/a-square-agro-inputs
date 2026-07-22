import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a pulsing placeholder div with default classes", () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass("animate-pulse");
    expect(div).toHaveClass("bg-primary-50");
  });

  it("merges a custom className", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("animate-pulse");
    expect(div).toHaveClass("h-4");
    expect(div).toHaveClass("w-full");
  });
});
