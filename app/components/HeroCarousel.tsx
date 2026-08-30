"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toPersianNumber } from "@/app/utils/numbers";
import type { HeroSlide } from "@/lib/types";

/** How long each slide stays on screen before auto-advancing. */
const AUTOPLAY_MS = 6000;

/**
 * The headline scale, shared by the h1 and by the plain <p> the other slides
 * use, so the two can never drift apart visually. It climbs through the
 * project's wide breakpoints (3xl = 1920px, 4xl = 2560px) because a banner this
 * tall looks empty at desktop type sizes.
 */
const TITLE_CLASS =
  "mb-4 3xl:mb-6 font-extrabold uppercase leading-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl 3xl:text-6xl 4xl:text-7xl " +
  // Dark grey, set on the heading itself so it beats the `text-white` the copy
  // block inherits. A fixed hex rather than a theme token: this sits on a
  // photograph, which does not change with the site's light/dark mode.
  "text-[#33373d] " +
  // Much lighter than before, and a pale halo rather than a dark one — a dark
  // shadow under dark glyphs adds nothing but mud. This just lifts the text off
  // a busy photo without reading as a shadow.
  "[text-shadow:0_1px_2px_rgb(255_255_255/0.55)]";

/** `uppercase` is inert for Persian, which has no letter case; it is there for
 *  slide titles written in Latin script. */

/**
 * Auto-rotating hero banner. Each slide carries its own image, badge, title,
 * subtitle and button. Progress is shown as segmented bars at the bottom: the
 * active bar fills over AUTOPLAY_MS and, when it finishes, advances the slide —
 * so the bar animation is the single source of truth and pausing it (on hover,
 * hidden tab, or reduced-motion) pauses the whole carousel in lock-step.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  // Hover and tab-visibility are tracked separately. They used to share one
  // `paused` flag, and each overwrote the other: returning to the tab while the
  // pointer sat on the banner cleared the hover pause, and a tab switch during
  // hover could leave it paused with nothing to clear it.
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
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
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    // Leaving the window entirely often produces no mouseleave, which used to
    // strand the banner in the hovered state until the pointer came back.
    const onBlur = () => setHovered(false);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Snap back into range if the active slide is removed (admin edits, etc.).
  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  const autoplay = !reduced && !hovered && !hidden && count > 1;

  /**
   * Watchdog.
   *
   * Advancing hangs off the progress bar's `animationend`, which is elegant
   * while it works — but that event is not guaranteed. A backgrounded tab can
   * throttle the animation to a stop and never deliver it, and a paused
   * animation that resumes past its end delivers nothing either. Either way the
   * banner sits on one slide with a full bar, which is the reported symptom.
   *
   * This is a floor, not the mechanism: it fires a beat after the animation
   * should already have finished, so in the normal case `animationend` has
   * changed `index` and cleared this timer long before it runs.
   */
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % Math.max(count, 1)),
      AUTOPLAY_MS + 1500
    );
    return () => clearTimeout(id);
    // Re-armed on every slide change and whenever autoplay starts or stops.
  }, [index, autoplay, count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);
  const advance = () => go(index + 1);

  return (
    <div
      className="group relative h-full w-full overflow-hidden bg-surface-2 transform-[translateZ(0)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // pointerleave also covers a touch or pen that leaves without a mouse
      // event, which is another way the banner used to stay stuck as hovered.
      onPointerLeave={() => setHovered(false)}
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
            {/*
              `contain` on phones, `cover` from md.

              A phone frame is about 0.55 wide-over-tall; the banners in use run
              1.78 and 1.50. Covering a portrait frame with a 16:9 photo throws
              away roughly 69% of its width, so the slide showed a narrow
              vertical slice of itself. Containing it shows the whole banner and
              lets the wash fill the rest. From md the frame is landscape again
              and cover is the right fit.

              `object-top` in BOTH modes, not just on mobile. Under `cover` a
              tall subject in a wide frame loses height, and centring the crop
              takes it off the top — which decapitated the figures. Anchoring to
              the top spends the whole crop on the base of the shot instead, so
              a character's head survives.

              The Ken-Burns zoom is md-only: scaling a contained image inside an
              overflow-hidden box crops exactly the edges `contain` just
              rescued.
            */}
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-contain object-top md:object-cover ${
                isActive && !reduced ? "md:animate-hero-zoom" : ""
              }`}
              style={
                isActive && !reduced
                  ? { animationDuration: `${AUTOPLAY_MS + 700}ms` }
                  : undefined
              }
            />
            {/* Copy sits on the site's own measure rather than the image edge,
                so it stays aligned with every section below it — and does not
                drift to the far corner of an ultrawide screen. */}
            <div className="relative z-10 flex h-full items-end">
              <div className="site-container">
                {/* pb clears the progress bars pinned at bottom-4 as well as
                    giving the block its own breathing room; the inline padding
                    comes from site-container, so the copy keeps the same right
                    margin as every section below the hero. */}
                <div className="max-w-xl pb-20 sm:pb-24 3xl:pb-28 md:max-w-2xl lg:max-w-3xl 3xl:max-w-4xl text-white">
                  {slide.badgeText && (
                    <span className="mb-4 3xl:mb-6 inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-content shadow-lg shadow-black/25 sm:text-sm md:px-5 md:py-2 md:text-base 3xl:text-lg">
                      {toPersianNumber(slide.badgeText)}
                    </span>
                  )}
                  {/*
                    Only the first slide's title is the page's h1 — every slide
                    is in the DOM at once, so making them all h1 would ship a
                    handful of competing headings on the home page.
                  */}
                  {i === 0 ? (
                    <h1 className={TITLE_CLASS}>{slide.title}</h1>
                  ) : (
                    <p className={TITLE_CLASS}>{slide.title}</p>
                  )}
                  {slide.subtitle && (
                    <p className="mb-7 3xl:mb-10 max-w-md md:max-w-lg lg:max-w-xl 3xl:max-w-2xl text-sm font-semibold leading-relaxed text-white sm:text-base md:text-lg lg:text-xl 3xl:text-2xl 4xl:text-3xl [text-shadow:0_1px_2px_rgb(0_0_0/0.6),0_3px_14px_rgb(0_0_0/0.5)]">
                      {toPersianNumber(slide.subtitle)}
                    </p>
                  )}
                  {slide.ctaText && (
                    <div>
                      <Link
                        href={slide.ctaHref || "/products"}
                        tabIndex={isActive ? undefined : -1}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-7 py-3 text-base font-bold text-primary-content shadow-lg shadow-primary/25 transition-all duration-200 cursor-pointer active:scale-95 hover:bg-primary-hover hover:border-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 sm:px-9 sm:py-3.5 sm:text-lg md:px-10 md:py-4 md:text-xl 3xl:px-12 3xl:py-5 3xl:text-2xl"
                      >
                        {slide.ctaText}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
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
                // The button is a tall, transparent hit area; the visible rail
                // is the inner span. Shrinking the button itself to 2px would
                // have made these near-impossible to tap.
                className="group/bar flex h-4 w-9 sm:w-14 shrink-0 items-center bg-transparent cursor-pointer"
              >
                {/* The rail. The fills are absolute against THIS, not against
                    the button — the button is now a transparent hit area with
                    no positioning of its own. */}
                <span
                  className={`relative block h-0.5 w-full overflow-hidden rounded-full transition-colors ${
                    i === index
                      ? "bg-white/45"
                      : "bg-white/30 group-hover/bar:bg-white/55"
                  } shadow-[0_1px_4px_rgb(0_0_0/0.35)]`}
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
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
