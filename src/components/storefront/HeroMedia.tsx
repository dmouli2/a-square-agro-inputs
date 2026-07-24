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
 */
export function HeroMedia({ posterSrc, posterAlt, videoSrc }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

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
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-primary-950/90 via-primary-950/55 via-50% to-primary-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/60 via-primary-950/15 via-40% to-transparent" />
    </div>
  );
}
