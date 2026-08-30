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
  /** Advance one card, wrapping seamlessly. */
  step: (direction: 1 | -1) => void;
  /** Jump to a logical card (0..items.length-1) in the nearest copy. */
  jumpTo: (logical: number) => void;
}

const ShowcaseRail = forwardRef<
  RailHandle,
  { items: RailItem[]; size: "lg" | "sm"; label: string; onSettle?: () => void }
>(function ShowcaseRail({ items, size, label, onSettle }, ref) {
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  /** Index into the tripled list. Starts in the middle copy. */
  const slotRef = useRef(items.length);

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

  const glideTo = useCallback(
    (i: number, onDone?: () => void) => {
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
          onDone?.();
          onSettle?.();
        }
      };
      raf.current = requestAnimationFrame(frame);
    },
    [offsetFor, onSettle]
  );

  /**
   * Put the track back in the middle copy without animating.
   *
   * The loop is three copies of the list wide, and playback lives in the middle
   * one. Once a move lands in an outer copy, the slot is shifted by one list
   * length and the scroll position is set — not glided — to the identical card
   * in the middle. Same pixels on screen, so the jump is invisible, and the
   * track always has a full copy of runway in both directions.
   */
  const recentre = useCallback(() => {
    const el = trackRef.current;
    const n = items.length;
    if (!el || n === 0) return;
    let slot = slotRef.current;
    if (slot >= 2 * n) slot -= n;
    else if (slot < n) slot += n;
    else return;
    slotRef.current = slot;
    const to = offsetFor(slot);
    if (to !== null) el.scrollLeft = to;
  }, [items.length, offsetFor]);

  const step = useCallback(
    (direction: 1 | -1) => {
      slotRef.current += direction;
      glideTo(slotRef.current, recentre);
    },
    [glideTo, recentre]
  );

  const jumpTo = useCallback(
    (logical: number) => {
      const n = items.length;
      if (n === 0) return;
      slotRef.current = n + ((logical % n) + n) % n;
      glideTo(slotRef.current, recentre);
    },
    [glideTo, recentre, items.length]
  );

  useImperativeHandle(ref, () => ({ step, jumpTo }), [step, jumpTo]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  /**
   * Start in the middle copy, without animation.
   *
   * Layout has to have happened for offsetLeft to mean anything, so this runs
   * after paint; a rAF tick is enough and avoids a visible jump from 0.
   */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length === 0) return;
    const place = () => {
      slotRef.current = items.length;
      const to = offsetFor(items.length);
      if (to !== null) el.scrollLeft = to;
    };
    const id = requestAnimationFrame(place);
    // Re-seat on resize: every offset is measured in pixels that just changed.
    const ro = new ResizeObserver(() => place());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [items.length, offsetFor]);

  const big = size === "lg";
  // Roughly Apple's proportions: the wide row about half the viewport, the row
  // beneath it a little over a third of that, both near 16:9.
  const card = big
    ? "w-[86vw] sm:w-[62vw] lg:w-[49vw] 3xl:w-[46vw]"
    : "w-[46vw] sm:w-[28vw] lg:w-[18.5vw] 3xl:w-[17vw]";

  if (items.length === 0) return null;

  // Three copies: one on screen, one of runway ahead, one behind — so a step
  // in either direction always has somewhere to go before the silent re-seat.
  const loop = [0, 1, 2].flatMap((copy) =>
    items.map((item) => ({ item, key: `${item.key}-c${copy}` }))
  );

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label={label}
      className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain"
    >
      {loop.map(({ item, key }) => (
        <Link
          key={key}
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
