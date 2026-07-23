"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";

interface FarmerPromiseVisualProps {
  imageSrc: string;
  imageAlt: string;
  /** CSS object-position, so a subject sitting high in the frame doesn't get cropped out on
   *  the shorter/wider mobile card. Defaults to a plain center crop. */
  imagePosition?: string;
}

/** The "Our Promise" section's illustration, in the same rounded-card treatment used everywhere
 *  else on the site (product cards, cart, checkout) — a soft ambient glow behind it and a subtle
 *  cursor-tilt are the only departures from a plain static image. */
export function FarmerPromiseVisual({ imageSrc, imageAlt, imagePosition = "center" }: FarmerPromiseVisualProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", `${(py * -4).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(px * 4).toFixed(2)}deg`);
  }

  function handleMouseLeave() {
    cardRef.current?.style.setProperty("--tilt-x", "0deg");
    cardRef.current?.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div className="relative h-72 md:h-96">
      <div aria-hidden className="float-organic-shadow absolute inset-6 rounded-card bg-soil-300/40 blur-2xl" />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-full w-full rounded-card transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: "perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-card shadow-card-hover">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
        </div>
      </div>
    </div>
  );
}
