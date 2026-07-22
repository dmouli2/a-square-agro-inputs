import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CartCleanup } from "./CartCleanup";
import { removeManyFromCart } from "@/app/actions/cart";

vi.mock("@/app/actions/cart", () => ({
  removeManyFromCart: vi.fn(),
}));

describe("CartCleanup", () => {
  beforeEach(() => {
    vi.mocked(removeManyFromCart).mockReset();
  });

  it("renders nothing", () => {
    const { container } = render(<CartCleanup staleVariantIds={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not call removeManyFromCart when there are no stale ids", () => {
    render(<CartCleanup staleVariantIds={[]} />);
    expect(removeManyFromCart).not.toHaveBeenCalled();
  });

  it("calls removeManyFromCart once with the stale ids when present", () => {
    render(<CartCleanup staleVariantIds={["v1", "v2"]} />);
    expect(removeManyFromCart).toHaveBeenCalledTimes(1);
    expect(removeManyFromCart).toHaveBeenCalledWith(["v1", "v2"]);
  });

  it("does not call it again on a re-render with a different array, thanks to the ref guard", () => {
    const { rerender } = render(<CartCleanup staleVariantIds={["v1"]} />);
    expect(removeManyFromCart).toHaveBeenCalledTimes(1);

    rerender(<CartCleanup staleVariantIds={["v1", "v3"]} />);
    expect(removeManyFromCart).toHaveBeenCalledTimes(1);
  });
});
