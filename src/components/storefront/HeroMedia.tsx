"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * `navigator.connection` (the Network Information API) isn't in the standard TS DOM lib —
 * it's Chromium-only, absent on Safari/Firefox.
 */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

function hasGoodConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  // API unsupported on this browser (Safari/Firefox) — no signal either way, so don't block video.
  if (!connection) return true;
  if (connection.saveData) return false;
  if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") return false;
  return true;
}

interface HeroMediaProps {
  posterSrc: string;
  posterAlt: string;
  /** Optional — when omitted (or skipped by the checks below) only the poster photo renders. */
  videoSrc?: string;
}

/**
 * Hero background: the poster photo always paints first (and stays priority-loaded for LCP).
 * A looping muted video is layered on top and cross-faded in only once it reports it can
 * actually play smoothly — and only when the visitor's device/network conditions say it's a
 * good idea (skipped entirely under prefers-reduced-motion, Data Saver, or a 2G/slow-2G
 * connection). On any of those, or if the video errors, visitors simply see the poster —
 * matching the brief: "if no proper data only the thumbnail should come".
 *
 * iOS Safari (particularly in Low Power Mode) can silently ignore the `autoPlay` attribute
 * even with `muted`+`playsInline` set correctly — the video just sits paused on its first
 * frame with no error. We don't rely on the attribute alone: `play()` is called explicitly so
 * a rejected promise is actually observable, and a real tap-to-play button (a genuine user
 * gesture, which every mobile browser's autoplay policy allows) is the guaranteed fallback.
 */
export function HeroMedia({ posterSrc, posterAlt, videoSrc }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  useEffect(() => {
    if (!videoSrc) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    if (!hasGoodConnection()) return;
    // matchMedia/navigator.connection don't exist during SSR, so this can only be decided
    // once we're actually running in the browser — an effect is the correct place for it,
    // not something derivable during render without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShouldLoadVideo(true);
  }, [videoSrc]);

  function attemptPlay() {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(
      () => setNeedsTapToPlay(false),
      // Autoplay blocked by the browser (e.g. iOS Low Power Mode) — fall back to a real
      // tap, which is always exempt from autoplay restrictions since it's a user gesture.
      () => setNeedsTapToPlay(true)
    );
  }

  return (
    <div className="absolute inset-0 bg-primary-950">
      <Image src={posterSrc} alt={posterAlt} fill preload fetchPriority="high" sizes="100vw" className="object-cover" />

      {shouldLoadVideo && videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          data-testid="hero-video"
          onCanPlay={attemptPlay}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false);
            setNeedsTapToPlay(false);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {needsTapToPlay && (
        <button
          type="button"
          onClick={attemptPlay}
          aria-label="Play background video"
          className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-primary-950/90 via-primary-950/55 via-50% to-primary-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/60 via-primary-950/15 via-40% to-transparent" />
    </div>
  );
}
