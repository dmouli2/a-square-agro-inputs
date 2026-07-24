import { describe, it, expect, vi } from "vitest";
import { useTransition } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartCountProvider, useCartCount } from "./CartCountContext";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Mirrors real usage: bump() is paired with an awaited async action inside the transition, so
 *  the optimistic value stays visible for the transition's whole lifetime — not just the
 *  synchronous tick — exactly like a real consumer bumping alongside a Server Action call. */
function Consumer({ pendingAction }: { pendingAction: () => Promise<void> }) {
  const { count, bump } = useCartCount();
  const [, startTransition] = useTransition();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            bump(1);
            await pendingAction();
          })
        }
      >
        +1
      </button>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            bump(-1);
            await pendingAction();
          })
        }
      >
        -1
      </button>
    </div>
  );
}

describe("CartCountProvider / useCartCount", () => {
  it("starts at the given initial count", () => {
    const { promise } = deferred();
    render(
      <CartCountProvider initialCount={3}>
        <Consumer pendingAction={() => promise} />
      </CartCountProvider>
    );
    expect(screen.getByTestId("count")).toHaveTextContent("3");
  });

  it("bumps the count optimistically while the paired action is pending", async () => {
    const { promise, resolve } = deferred();
    render(
      <CartCountProvider initialCount={3}>
        <Consumer pendingAction={() => promise} />
      </CartCountProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "+1" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("4"));
    resolve();
  });

  it("never goes below zero", async () => {
    const { promise, resolve } = deferred();
    render(
      <CartCountProvider initialCount={0}>
        <Consumer pendingAction={() => promise} />
      </CartCountProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "-1" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
    resolve();
  });

  it("resyncs when initialCount changes (e.g. after the server revalidates)", () => {
    const { promise } = deferred();
    const { rerender } = render(
      <CartCountProvider initialCount={3}>
        <Consumer pendingAction={() => promise} />
      </CartCountProvider>
    );
    rerender(
      <CartCountProvider initialCount={7}>
        <Consumer pendingAction={() => promise} />
      </CartCountProvider>
    );
    expect(screen.getByTestId("count")).toHaveTextContent("7");
  });

  it("throws if used outside a CartCountProvider", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer pendingAction={() => Promise.resolve()} />)).toThrow(
      "useCartCount must be used within a CartCountProvider"
    );
    consoleErrorSpy.mockRestore();
  });
});
