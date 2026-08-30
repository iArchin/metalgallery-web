"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ShowcaseRail, { type RailHandle, type RailItem } from "@/app/components/ShowcaseRail";
import { toPersianNumber } from "@/app/utils/numbers";

/**
 * Two tracks driven as ONE carousel: a shared index, one timer, one set of
 * dots, one pause button — which is what makes a pair of rows read as a single
 * component rather than as two sliders that happen to be stacked.
 *
 * The rows hold different numbers of cards, so each is asked for the position
 * proportional to the shared progress rather than for the same card number.
 * Otherwise the shorter row would run out and sit still while the longer one
 * kept going.
 */

/** How long each position holds before advancing. */
const DWELL_MS = 5000;

export default function ShowcaseRails({
  featured,
  categories,
  heading,
}: {
  featured: RailItem[];
  categories: RailItem[];
  heading: string;
}) {
  const top = useRef<RailHandle>(null);
  const bottom = useRef<RailHandle>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Dots track the wide row — it is the one being read.
  const count = Math.max(featured.length, 1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);

    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    // Leaving the window often produces no mouseleave, which would otherwise
    // strand the carousel paused.
    const onBlur = () => setHovered(false);
    window.addEventListener("blur", onBlur);
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /** Move both rows to the position matching `i` on the wide row. */
  const show = useCallback(
    (i: number) => {
      top.current?.goTo(i);
      if (categories.length > 0 && count > 1) {
        // Proportional, not identical: the rows are different lengths.
        const share = i / (count - 1);
        bottom.current?.goTo(Math.round(share * (categories.length - 1)));
      }
    },
    [categories.length, count]
  );

  useEffect(() => {
    show(index);
  }, [index, show]);

  const running = playing && !hovered && !hidden && !reduced && count > 1;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), DWELL_MS);
    return () => clearTimeout(id);
  }, [running, index, count]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerLeave={() => setHovered(false)}
    >
      <h2 className="site-container mb-6 text-center text-3xl font-extrabold text-content sm:mb-8 sm:text-4xl 3xl:text-5xl">
        {heading}
      </h2>

      {/* Full-bleed and tightly gapped, so neighbouring cards peek in from both
          edges — that peek is what says the row continues. */}
      <div className="space-y-2.5">
        <ShowcaseRail ref={top} items={featured} size="lg" label="پیشنهادهای ویژه" />
        <ShowcaseRail ref={bottom} items={categories} size="sm" label="دسته‌بندی‌ها" />
      </div>

      <div className="relative mt-5 flex items-center justify-center px-4">
        <div className="flex items-center gap-2">
          {featured.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`رفتن به ${toPersianNumber(i + 1)}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-2 bg-content" : "w-2 bg-content-subtle/50 hover:bg-content-subtle"
              }`}
            />
          ))}
        </div>

        {/* Pause sits at the trailing edge, out of the dots' way. */}
        {count > 1 && !reduced && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "توقف چرخش" : "ادامه چرخش"}
            className="absolute left-4 grid h-8 w-8 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            {playing ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5l11 7-11 7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
