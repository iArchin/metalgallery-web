"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toPersianNumber } from "@/app/utils/numbers";
import type { HeroSlide } from "@/lib/types";

/** How long each slide stays on screen before auto-advancing. */
const AUTOPLAY_MS = 6000;

/**
 * Auto-rotating hero banner. Each slide carries its own image, badge, title,
 * subtitle and button. Progress is shown as segmented bars at the bottom: the
 * active bar fills over AUTOPLAY_MS and, when it finishes, advances the slide —
 * so the bar animation is the single source of truth and pausing it (on hover,
 * hidden tab, or reduced-motion) pauses the whole carousel in lock-step.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  const count = slides.length;

  // Honour the OS "reduce motion" setting: no autoplay, no Ken-Burns zoom.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause while the tab is hidden so the bar can't drift out of sync.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Snap back into range if the active slide is removed (admin edits, etc.).
  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);
  const advance = () => go(index + 1);
  const autoplay = !reduced && !paused && count > 1;

  return (
    <div
      className="group relative h-full w-full overflow-hidden bg-surface-2 transform-[translateZ(0)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="کاروسل"
      aria-label="بنر اصلی فروشگاه"
    >
      {slides.map((slide, i) => {
        const isActive = i === index;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            role="group"
            aria-roledescription="اسلاید"
            aria-label={`${toPersianNumber(i + 1)} از ${toPersianNumber(count)}`}
            aria-hidden={!isActive}
          >
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover ${
                isActive && !reduced ? "animate-hero-zoom" : ""
              }`}
              style={
                isActive && !reduced
                  ? { animationDuration: `${AUTOPLAY_MS + 700}ms` }
                  : undefined
              }
            />
            <div
              className="absolute inset-0 bg-linear-to-l from-black/75 via-black/45 to-transparent"
              aria-hidden
            />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-6 sm:p-10 text-white">
              {slide.badgeText && (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-content">
                  {toPersianNumber(slide.badgeText)}
                </span>
              )}
              <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mb-5 max-w-sm text-sm sm:text-base font-semibold text-white/85 leading-relaxed">
                  {toPersianNumber(slide.subtitle)}
                </p>
              )}
              {slide.ctaText && (
                <div>
                  <Link
                    href={slide.ctaHref || "/products"}
                    tabIndex={isActive ? undefined : -1}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-8 py-3 text-lg font-bold text-content border border-border cursor-pointer transition-all duration-200 active:scale-95 hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          {/* Prev / Next — reveal on hover or keyboard focus */}
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="اسلاید قبلی"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={advance}
            aria-label="اسلاید بعدی"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Progress bars */}
          <div
            dir="ltr"
            className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 px-6"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`رفتن به اسلاید ${toPersianNumber(i + 1)}`}
                aria-current={i === index}
                className={`relative h-1.5 w-9 sm:w-14 shrink-0 overflow-hidden rounded-full transition-colors cursor-pointer ${
                  i === index ? "bg-white/45" : "bg-white/30 hover:bg-white/50"
                }`}
              >
                {/* Slides already seen this cycle read as full. */}
                <span
                  className="absolute inset-0 origin-left rounded-full bg-white"
                  style={{ transform: i < index ? "scaleX(1)" : "scaleX(0)" }}
                  aria-hidden
                />
                {i === index && !reduced && (
                  <span
                    key={index}
                    onAnimationEnd={advance}
                    className="animate-hero-bar absolute inset-0 origin-left rounded-full bg-white"
                    style={{
                      animationDuration: `${AUTOPLAY_MS}ms`,
                      animationPlayState: autoplay ? "running" : "paused",
                    }}
                    aria-hidden
                  />
                )}
                {i === index && reduced && (
                  <span
                    className="absolute inset-0 origin-left rounded-full bg-white"
                    aria-hidden
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
