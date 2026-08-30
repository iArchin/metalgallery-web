"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Link from "next/link";

/**
 * One horizontal snap rail. Its arrows live in the parent, which drives both
 * rails from a single pair of controls — see ShowcaseRails.
 */

/**
 * Apple's UI easing, cubic-bezier(0.32, 0.72, 0, 1).
 *
 * Strongly front-loaded: measured, it covers ~78% of the distance in the first
 * quarter of the duration and spends the rest decelerating. That is what gives
 * the motion its characteristic "responds instantly, settles softly" feel —
 * the opposite of a symmetric ease, and the reason the duration can be as long
 * as 600ms without the control feeling laggy.
 */
const EASE = (t: number): number => {
  // cubic-bezier(0.32, 0.72, 0, 1), solved for y at x = t.
  const c = 3 * 0.32;
  const b = 3 * (0 - 0.32) - c;
  const a = 1 - c - b;
  const cy = 3 * 0.72;
  const by = 3 * (1 - 0.72) - cy;
  const ay = 1 - cy - by;
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
  tag?: string;
}

export interface RailHandle {
  /** -1 = toward the start, +1 = toward the end, in reading order. */
  step: (direction: -1 | 1) => void;
  edges: () => { atStart: boolean; atEnd: boolean };
}

const ShowcaseRail = forwardRef<
  RailHandle,
  { items: RailItem[]; size: "lg" | "sm"; label: string; onEdges?: () => void }
>(function ShowcaseRail({ items, size, label, onEdges }, ref) {
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  const edges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return { atStart: true, atEnd: true };
    // scrollLeft is NEGATIVE in RTL and positive in LTR, so compare magnitudes.
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    return { atStart: pos <= 4, atEnd: max <= 4 || pos >= max - 4 };
  }, []);

  /** One card plus its gap, measured rather than assumed. */
  const cardStep = () => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !card) return 320;
    const gap = parseFloat(getComputedStyle(el).columnGap || "16") || 16;
    return card.offsetWidth + gap;
  };

  const step = useCallback((direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    // In RTL the axis runs the other way, so "toward the end" is a decreasing
    // scrollLeft. Without this the arrows were inverted, and at rest (0) the
    // forward one wrote a positive value that the browser clamped straight back
    // — which looked exactly like the animation not playing at all.
    const axis = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    const delta = direction * axis * cardStep();

    if (raf.current) cancelAnimationFrame(raf.current);

    // Snap has to come off for the duration. With `snap-mandatory` the browser
    // re-snaps after every scrollLeft write, which fights a per-frame animation
    // and leaves it juddering or motionless.
    const snap = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";

    const from = el.scrollLeft;
    const start = performance.now();
    const finish = () => {
      el.style.scrollSnapType = snap;
      onEdges?.();
    };
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      el.scrollLeft = from + delta * EASE(t);
      if (t < 1) raf.current = requestAnimationFrame(frame);
      else finish();
    };
    raf.current = requestAnimationFrame(frame);
  }, [onEdges]);

  useImperativeHandle(ref, () => ({ step, edges }), [step, edges]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onEdges?.());
    ro.observe(el);
    onEdges?.();
    return () => ro.disconnect();
  }, [onEdges, items.length]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const big = size === "lg";
  const cardW = big
    ? "w-[78vw] sm:w-[46vw] lg:w-[30rem] 3xl:w-[36rem]"
    : "w-[52vw] sm:w-[30vw] lg:w-[19rem] 3xl:w-[23rem]";
  const cardH = big
    ? "h-[26rem] sm:h-[30rem] 3xl:h-[34rem]"
    : "h-[15rem] sm:h-[17rem] 3xl:h-[20rem]";

  if (items.length === 0) return null;

  return (
    <div
      ref={trackRef}
      onScroll={() => onEdges?.()}
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
  );
});

export default ShowcaseRail;
