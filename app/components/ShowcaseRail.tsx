"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * A horizontal snap rail, in the shape Apple uses for the stacked carousels
 * above its footer: a big row over a smaller one, both scrolling independently.
 *
 * Three details do most of the work of making it feel right:
 *
 *  • Scrolling is animated in JS, not by `scroll-behavior: smooth`. The native
 *    curve and duration are the browser's and differ across them; a rAF pass
 *    with a fixed easing gives every visitor the same motion.
 *  • The track is scroll-snapped, so a flick or a trackpad swipe still settles
 *    on a card rather than halfway across one.
 *  • Arrows disable at the ends instead of scrolling into empty space, and hide
 *    entirely when everything already fits.
 */

/** Apple's UI easing — slow out of the gate, long glide, hard settle. */
const EASE = (t: number): number => {
  // cubic-bezier(0.32, 0.72, 0, 1), solved for y at x = t.
  const c = 3 * 0.32;
  const b = 3 * (0 - 0.32) - c;
  const a = 1 - c - b;
  const cy = 3 * 0.72;
  const by = 3 * (1 - 0.72) - cy;
  const ay = 1 - cy - by;
  // Newton's method: find the parametric x that matches t, then read y.
  let x = t;
  for (let i = 0; i < 6; i++) {
    const fx = ((a * x + b) * x + c) * x - t;
    const d = (3 * a * x + 2 * b) * x + c;
    if (Math.abs(d) < 1e-6) break;
    x -= fx / d;
  }
  return ((ay * x + by) * x + cy) * x;
};

const DURATION = 600;

export interface RailItem {
  key: string;
  href: string;
  title: string;
  subtitle?: string;
  image: string;
  /** Optional corner tag, e.g. a discount. */
  tag?: string;
}

export default function ShowcaseRail({
  items,
  size,
  label,
}: {
  items: RailItem[];
  /** `lg` is the top row, `sm` the row beneath it. */
  size: "lg" | "sm";
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // RTL scrollLeft is negative in this direction, so compare on magnitude.
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setOverflows(max > 4);
    setAtStart(pos <= 4);
    setAtEnd(pos >= max - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync, items.length]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  /** Animate scrollLeft ourselves so the curve and duration are ours. */
  const glide = (delta: number) => {
    const el = trackRef.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    const from = el.scrollLeft;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      el.scrollLeft = from + delta * EASE(t);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else sync();
    };
    raf.current = requestAnimationFrame(step);
  };

  /** One card plus its gap — a page is a card, the way Apple's arrows behave. */
  const cardStep = () => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !card) return 320;
    const gap = parseFloat(getComputedStyle(el).columnGap || "16") || 16;
    return card.offsetWidth + gap;
  };

  const big = size === "lg";
  const cardW = big
    ? "w-[78vw] sm:w-[46vw] lg:w-[30rem] 3xl:w-[36rem]"
    : "w-[52vw] sm:w-[30vw] lg:w-[19rem] 3xl:w-[23rem]";
  const cardH = big ? "h-[26rem] sm:h-[30rem] 3xl:h-[34rem]" : "h-[15rem] sm:h-[17rem] 3xl:h-[20rem]";

  if (items.length === 0) return null;

  return (
    <div className="group/rail relative">
      <div
        ref={trackRef}
        onScroll={sync}
        role="region"
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:gap-5 sm:px-6 3xl:px-8"
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`group/card relative shrink-0 snap-start overflow-hidden rounded-3xl bg-surface-2 ${cardW} ${cardH}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
            />
            <span
              className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"
              aria-hidden
            />
            {item.tag && (
              <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-content">
                {item.tag}
              </span>
            )}
            <div className={`absolute inset-x-0 bottom-0 p-5 text-white ${big ? "sm:p-7" : "sm:p-5"}`}>
              {item.subtitle && (
                <p className={`mb-1 font-semibold text-white/80 ${big ? "text-sm" : "text-xs"}`}>
                  {item.subtitle}
                </p>
              )}
              <h3
                className={`font-extrabold leading-snug ${
                  big ? "text-xl sm:text-2xl 3xl:text-3xl" : "text-base sm:text-lg"
                }`}
              >
                {item.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Arrows. Hidden when nothing overflows, and while a rail is at its end
          the matching arrow is disabled rather than removed, so the controls do
          not jump around as you scroll. */}
      {overflows && (
        <>
          <button
            type="button"
            onClick={() => glide(-cardStep())}
            disabled={atStart}
            aria-label="قبلی"
            className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-content shadow-lg backdrop-blur transition-all hover:bg-surface disabled:pointer-events-none disabled:opacity-0 md:grid md:h-11 md:w-11"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => glide(cardStep())}
            disabled={atEnd}
            aria-label="بعدی"
            className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-content shadow-lg backdrop-blur transition-all hover:bg-surface disabled:pointer-events-none disabled:opacity-0 md:grid md:h-11 md:w-11"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
