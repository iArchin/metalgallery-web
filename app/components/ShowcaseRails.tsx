"use client";

import { useCallback, useRef, useState } from "react";
import ShowcaseRail, { type RailHandle, type RailItem } from "@/app/components/ShowcaseRail";

/**
 * The two rails plus ONE pair of arrows that drives both.
 *
 * A control per row meant two sets of buttons stacked down the same edge, which
 * read as clutter rather than as one component. A single pair moves both rows
 * together and is enabled while either still has somewhere to go — so the
 * shorter row simply stops at its end instead of disabling the control for the
 * longer one.
 */
export default function ShowcaseRails({
  featured,
  categories,
}: {
  featured: RailItem[];
  categories: RailItem[];
}) {
  const top = useRef<RailHandle>(null);
  const bottom = useRef<RailHandle>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const refresh = useCallback(() => {
    const a = top.current?.edges();
    const b = bottom.current?.edges();
    setCanPrev(!!(a && !a.atStart) || !!(b && !b.atStart));
    setCanNext(!!(a && !a.atEnd) || !!(b && !b.atEnd));
  }, []);

  const step = (direction: -1 | 1) => {
    top.current?.step(direction);
    bottom.current?.step(direction);
  };

  const arrow = (direction: -1 | 1, enabled: boolean, label: string, d: string) => (
    <button
      type="button"
      onClick={() => step(direction)}
      disabled={!enabled}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-content transition-all hover:border-primary hover:text-primary disabled:opacity-35 disabled:pointer-events-none"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </button>
  );

  return (
    <>
      <div className="site-container mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl 3xl:text-4xl font-extrabold text-content">
            دنیای متال گالری
          </h2>
          <p className="mt-2 text-sm sm:text-base text-content-muted">
            پیشنهادهای ویژه و دسته‌بندی‌های محبوب، یک‌جا
          </p>
        </div>
        {/* Desktop only: on a touch screen the rows are swiped, and a pair of
            arrows would just take room from the cards. */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {arrow(-1, canPrev, "قبلی", "M9 5l7 7-7 7")}
          {arrow(1, canNext, "بعدی", "M15 19l-7-7 7-7")}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <ShowcaseRail
          ref={top}
          items={featured}
          size="lg"
          label="پیشنهادهای ویژه"
          onEdges={refresh}
        />
        <ShowcaseRail
          ref={bottom}
          items={categories}
          size="sm"
          label="دسته‌بندی‌ها"
          onEdges={refresh}
        />
      </div>
    </>
  );
}
