import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("loads the video on a good connection with no reduced-motion preference, calls play() once playable, and fades it in once actually playing", async () => {
    mockConnection({ effectiveType: "4g" });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);

    const video = screen.getByTestId("hero-video") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "/videos/hero.webm");
    expect(video).toHaveClass("opacity-0");

    fireEvent.canPlay(video);
    expect(video.play).toHaveBeenCalled();

    fireEvent.playing(video);
    expect(video).toHaveClass("opacity-100");
    expect(screen.queryByRole("button", { name: "Play background video" })).not.toBeInTheDocument();
  });

  it("keeps the poster visible (video stays hidden) if the video errors out", () => {
    mockConnection({ effectiveType: "4g" });
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);

    const video = screen.getByTestId("hero-video");
    fireEvent.canPlay(video);
    fireEvent.playing(video);
    expect(video).toHaveClass("opacity-100");

    fireEvent.error(video);
    expect(video).toHaveClass("opacity-0");
  });

  it("shows a tap-to-play button when the browser blocks autoplay, and starts playback on click", async () => {
    mockConnection({ effectiveType: "4g" });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValueOnce(new DOMException("blocked", "NotAllowedError"));
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);

    const video = screen.getByTestId("hero-video");
    fireEvent.canPlay(video);

    const playButton = await screen.findByRole("button", { name: "Play background video" });

    vi.mocked(HTMLMediaElement.prototype.play).mockResolvedValueOnce(undefined);
    fireEvent.click(playButton);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Play background video" })).not.toBeInTheDocument());

    fireEvent.playing(video);
    expect(video).toHaveClass("opacity-100");
  });

  it("treats an unsupported Network Information API as fine and still loads the video", () => {
    mockConnection(undefined);
    render(<HeroMedia posterSrc="/images/hero.jpg" posterAlt="Field" videoSrc="/videos/hero.webm" />);
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
  });
});
