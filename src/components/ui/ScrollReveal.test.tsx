import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ScrollReveal } from "./ScrollReveal";

describe("ScrollReveal", () => {
  const originalIO = window.IntersectionObserver;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let capturedCallback: IntersectionObserverCallback | undefined;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    capturedCallback = undefined;
    window.IntersectionObserver = vi.fn(function (this: unknown, callback: IntersectionObserverCallback) {
      capturedCallback = callback;
      return {
        observe: observeSpy,
        disconnect: disconnectSpy,
        unobserve: vi.fn(),
        takeRecords: vi.fn(() => []),
        root: null,
        rootMargin: "",
        thresholds: [],
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIO;
  });

  it("renders children immediately, starting hidden until observed", () => {
    render(
      <ScrollReveal>
        <p>Hello</p>
      </ScrollReveal>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hello").parentElement).not.toHaveClass("is-visible");
    expect(observeSpy).toHaveBeenCalled();
  });

  it("adds is-visible once the element intersects, and disconnects the observer", () => {
    render(
      <ScrollReveal>
        <p>Hello</p>
      </ScrollReveal>
    );

    act(() => {
      capturedCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByText("Hello").parentElement).toHaveClass("is-visible");
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("does not reveal when the entry is not yet intersecting", () => {
    render(
      <ScrollReveal>
        <p>Hello</p>
      </ScrollReveal>
    );

    capturedCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    expect(screen.getByText("Hello").parentElement).not.toHaveClass("is-visible");
    expect(disconnectSpy).not.toHaveBeenCalled();
  });

  it("applies a transition delay style when delayMs is given", () => {
    render(
      <ScrollReveal delayMs={200}>
        <p>Hello</p>
      </ScrollReveal>
    );
    expect(screen.getByText("Hello").parentElement).toHaveStyle({ transitionDelay: "200ms" });
  });

  it("falls back to already-visible when IntersectionObserver is unsupported", () => {
    // @ts-expect-error simulating an older browser
    delete window.IntersectionObserver;

    render(
      <ScrollReveal>
        <p>Hello</p>
      </ScrollReveal>
    );

    expect(screen.getByText("Hello").parentElement).toHaveClass("is-visible");
  });
});
