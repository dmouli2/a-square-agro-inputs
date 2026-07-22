import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroMedia } from "./HeroMedia";

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function mockConnection(connection: { saveData?: boolean; effectiveType?: string } | undefined) {
  Object.defineProperty(window.navigator, "connection", {
    value: connection,
    configurable: true,
  });
}

describe("HeroMedia", () => {
  afterEach(() => {
    mockMatchMedia(false);
    mockConnection(undefined);
  });

  it("always renders the poster photo", () => {
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Sunrise over a field" />);
    expect(screen.getByRole("img", { name: "Sunrise over a field" })).toHaveAttribute(
      "src",
      "/images/hero.jpg"
    );
  });

  it("does not render a video element when no videoSrc is given", () => {
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" />);
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("skips the video under prefers-reduced-motion", () => {
    mockMatchMedia(true);
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("skips the video when the browser reports Data Saver is on", () => {
    mockConnection({ saveData: true });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("skips the video on a reported slow-2g/2g connection", () => {
    mockConnection({ effectiveType: "2g" });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);
    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("loads the video on a good connection with no reduced-motion preference, and fades it in once playable", () => {
    mockConnection({ effectiveType: "4g" });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);

    const video = screen.getByTestId("hero-video");
    expect(video).toHaveAttribute("src", "/videos/hero.webm");
    expect(video).toHaveClass("opacity-0");

    fireEvent.canPlay(video);
    expect(video).toHaveClass("opacity-100");
  });

  it("keeps the poster visible (video stays hidden) if the video errors out", () => {
    mockConnection({ effectiveType: "4g" });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);

    const video = screen.getByTestId("hero-video");
    fireEvent.canPlay(video);
    expect(video).toHaveClass("opacity-100");

    fireEvent.error(video);
    expect(video).toHaveClass("opacity-0");
  });

  it("treats an unsupported Network Information API as fine and still loads the video", () => {
    mockConnection(undefined);
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
  });
});
