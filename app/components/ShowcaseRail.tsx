"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import Link from "next/link";

/**
 * One horizontal track of the showcase. It owns no controls and no timer — the
 * parent drives both tracks from a single index, so the two rows always move as
 * one component rather than as two carousels that happen to sit together.
 */

/**
 * Apple's UI easing, cubic-bezier(0.32, 0.72, 0, 1).
 *
 * Strongly front-loaded: measured, it covers ~78% of the distance in the first
 * quarter of the duration and spends the rest decelerating. That is what makes
 * a 600ms move feel immediate rather than laggy.
 */
const EASE = (t: number): number => {
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
  /** The line beside the button, e.g. a category or an age range. */
  subtitle?: string;
  image: string;
  /** Pill label, e.g. "خرید". */
  cta: string;
  tag?: string;
}

export interface RailHandle {
  /** Centre item `i` in the viewport. */
  goTo: (i: number) => void;
  /** Nearest item to the current scroll position, for syncing the dots. */
  nearest: () => number;
}

const ShowcaseRail = forwardRef<
  RailHandle,
  { items: RailItem[]; size: "lg" | "sm"; label: string; onSettle?: () => void }
>(function ShowcaseRail({ items, size, label, onSettle }, ref) {
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  /**
   * The scrollLeft that centres card `i`.
   *
   * `offsetLeft` is measured from the content's left edge in both writing
   * directions, so `target` — the content x that should sit at the viewport's
   * left edge — is direction-agnostic. Converting it to scrollLeft is not:
   *
   *   LTR: scrollLeft runs [0, max] and equals target directly.
   *   RTL: scrollLeft runs [-max, 0], and the visible left edge is
   *        `max + scrollLeft` — so scrollLeft = target - max.
   *
   * Negating target instead (the previous attempt) sends card 0, whose
   * offsetLeft in RTL is the LARGEST of the row, to the opposite end of the
   * track. That is why it appeared to animate to the wrong place.
   */
  const offsetFor = useCallback((i: number) => {
    const el = trackRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return null;
    const view = el.clientWidth;
    const max = el.scrollWidth - view;
    const target = card.offsetLeft - (view - card.offsetWidth) / 2;
    return getComputedStyle(el).direction === "rtl"
      ? Math.min(0, Math.max(-max, target - max))
      : Math.max(0, Math.min(target, max));
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const to = offsetFor(i);
      if (to === null) return;

      if (raf.current) cancelAnimationFrame(raf.current);
      // snap-mandatory re-snaps after every scrollLeft write and fights the
      // animation; it comes off for the glide and back on when it lands.
      const snap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";

      const from = el.scrollLeft;
      const delta = to - from;
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        el.scrollLeft = from + delta * EASE(t);
        if (t < 1) raf.current = requestAnimationFrame(frame);
        else {
          el.style.scrollSnapType = snap;
          onSettle?.();
        }
      };
      raf.current = requestAnimationFrame(frame);
    },
    [offsetFor, onSettle]
  );

  const nearest = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    // Both sides are now real scrollLeft values, signs included, so compare
    // them directly rather than on magnitude.
    const pos = el.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const o = offsetFor(i);
      if (o === null) continue;
      const d = Math.abs(o - pos);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }, [offsetFor]);

  useImperativeHandle(ref, () => ({ goTo, nearest }), [goTo, nearest]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const big = size === "lg";
  // Roughly Apple's proportions: the wide row about half the viewport, the row
  // beneath it a little over a third of that, both near 16:9.
  const card = big
    ? "w-[86vw] sm:w-[62vw] lg:w-[49vw] 3xl:w-[46vw]"
    : "w-[46vw] sm:w-[28vw] lg:w-[18.5vw] 3xl:w-[17vw]";

  if (items.length === 0) return null;

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label={label}
      className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`group/card relative aspect-16/9 shrink-0 snap-center overflow-hidden rounded-xl bg-surface-2 ${card}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {item.tag && (
            <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-content sm:top-4 sm:left-4 sm:text-xs">
              {item.tag}
            </span>
          )}

          {big ? (
            /* Wide row: pill and its caption sit side by side along the bottom,
               the way Apple runs "Stream now · The truth lies in the past." */
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 p-4 sm:p-6">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 transition-opacity group-hover/card:opacity-90 sm:text-sm">
                {item.cta}
              </span>
              <span className="text-xs font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] sm:text-sm">
                <span className="font-extrabold">{item.title}</span>
                {item.subtitle && <span className="text-white/80"> · {item.subtitle}</span>}
              </span>
            </div>
          ) : (
            /* Narrow row: title bottom-start, pill bottom-end. */
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
              <span className="min-w-0 truncate text-xs font-extrabold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] sm:text-sm">
                {item.title}
              </span>
              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-900 transition-opacity group-hover/card:opacity-90">
                {item.cta}
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
});

export default ShowcaseRail;
