"use client";

const DOODLE = "url('/images/doodle-pattern.png')";
const VERTICAL_FADE =
  "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)";

/**
 * Decorative toy-doodle texture behind the hero. The source PNG is black
 * line-art on transparent, so we use it as a *mask* over a solid colour layer
 * rather than a background image — that lets us tint the doodles per theme.
 * Light mode keeps them as faint dark ink; dark mode tints them with the brand
 * coral so they stay visible against the near-black background (plain black
 * doodles would vanish there).
 *
 * The outer element carries the vertical fade-out mask; the inner element
 * carries the doodle mask over the tint colour. Two single-layer masks avoid
 * the cross-browser quirks of `mask-composite`.
 */
export default function HeroBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ maskImage: VERTICAL_FADE, WebkitMaskImage: VERTICAL_FADE }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-content opacity-25 dark:bg-white dark:opacity-15"
        style={{
          maskImage: DOODLE,
          maskRepeat: "repeat",
          maskSize: "300px",
          WebkitMaskImage: DOODLE,
          WebkitMaskRepeat: "repeat",
          WebkitMaskSize: "300px",
        }}
      />
    </div>
  );
}
