"use client";

import { useEffect, useState } from "react";

const SEARCH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const TYPE_SPEED_MS = 55;
const DELETE_SPEED_MS = 30;
const HOLD_MS = 1400;
const GAP_MS = 300;

/** Types then erases each phrase in turn, standing in for the input's placeholder while it's
 *  empty and unfocused — a nudge toward "type here to search" rather than a static hint.
 *  Skips the animation (shows the first phrase outright) under prefers-reduced-motion. */
function useTypewriter(phrases: string[] | undefined, active: boolean): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!phrases || phrases.length === 0 || !active) {
      // Reset instantly the moment focus/typing turns the animation off — there's no external
      // system to sync against here, just clearing stale animated text before the next render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText("");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(phrases[0]);
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex];
      if (!deleting) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        timeoutId = setTimeout(tick, charIndex === current.length ? HOLD_MS : TYPE_SPEED_MS);
        if (charIndex === current.length) deleting = true;
      } else {
        charIndex -= 1;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = setTimeout(tick, GAP_MS);
        } else {
          timeoutId = setTimeout(tick, DELETE_SPEED_MS);
        }
      }
    };

    timeoutId = setTimeout(tick, GAP_MS);
    return () => clearTimeout(timeoutId);
  }, [phrases, active]);

  return text;
}

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  size?: "sm" | "lg";
  className?: string;
  /** Phrases to type/erase in place of the static placeholder while the field is empty and
   *  unfocused, e.g. ["Search seeds…", "Search fertilizers…"]. Omit for a plain static hint. */
  animatedPhrases?: string[];
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search seeds, fertilizers, sprayers…",
  size = "sm",
  className = "",
  animatedPhrases,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const animating = Boolean(animatedPhrases) && !focused && value.length === 0;
  const typed = useTypewriter(animatedPhrases, animating);

  const height = size === "lg" ? "h-14" : "h-11";
  const textSize = size === "lg" ? "text-base" : "text-sm";

  return (
    <form action="/shop" method="GET" role="search" className={`relative w-full ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
        {SEARCH_ICON}
      </span>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={animating ? "" : placeholder}
        aria-label="Search products"
        className={`w-full ${height} ${textSize} rounded-control border border-border bg-surface pl-11 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-shadow`}
      />
      {animating && (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 ${textSize} text-muted truncate max-w-[calc(100%-3.5rem)]`}
        >
          {typed}
          <span className="inline-block w-px h-[1em] bg-muted/70 ml-0.5 align-middle animate-pulse" />
        </span>
      )}
    </form>
  );
}
