"use client";

import Link from "next/link";
import { useState } from "react";
import type { Brand } from "@/lib/types";

export default function TopBrands({ brands }: { brands: Brand[] }) {
  // Brand ids whose logo image failed to load — fall back to a wordmark so a
  // missing/broken file never leaves an empty chip.
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);

  if (brands.length === 0) return null;

  // Repeat the brands so a single group comfortably exceeds most viewports,
  // then render that group twice. Animating the track to -50% swaps the first
  // group out for its identical duplicate — a seamless, gapless loop.
  const repeat = Math.max(2, Math.ceil(14 / brands.length));
  const group = Array.from({ length: repeat }, () => brands).flat();

  const markFailed = (id: number) =>
    setFailed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const renderGroup = (duplicate: boolean) => (
    // pr matches the flex gap so the last→first seam keeps even spacing.
    <ul
      className="flex items-start gap-6 sm:gap-8 pr-6 sm:pr-8 shrink-0 list-none m-0 p-0"
      aria-hidden={duplicate || undefined}
    >
      {group.map((brand, i) => {
        const showLogo = Boolean(brand.logo) && !failed.has(brand.id);
        return (
          <li key={`${brand.id}-${i}`} className="shrink-0">
            <Link
              href="/products"
              tabIndex={duplicate ? -1 : undefined}
              title={brand.name}
              className="group/brand flex w-40 sm:w-52 flex-col items-center gap-3"
            >
              {/* Bare logo — no chip. The fixed-height slot only keeps the
                  tiles aligned in the row. */}
              <div className="flex h-24 sm:h-28 w-full items-center justify-center">
                {showLogo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    loading="lazy"
                    onError={() => markFailed(brand.id)}
                    className="max-h-16 w-auto max-w-full object-contain transition-transform duration-300 group-hover/brand:scale-105 sm:max-h-20"
                  />
                ) : (
                  <span className="text-center text-lg font-extrabold text-content">
                    {brand.name}
                  </span>
                )}
              </div>
              {showLogo && (
                <span className="text-xs sm:text-sm font-bold text-content-muted text-center transition-colors group-hover/brand:text-primary">
                  {brand.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3 text-content">
          برندهای محبوب
        </h2>
        <p className="text-center text-sm sm:text-base text-content-muted">
          محبوب‌ترین برندهای اسباب‌بازی دنیا، یک‌جا
        </p>
      </div>

      {/* dir=ltr is essential: the page is RTL, which would otherwise anchor the
          track to the right and make the -50% scroll open a blank gap. Forcing
          LTR left-anchors the strip so the duplicate group fills the seam. */}
      <div
        dir="ltr"
        className="relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex w-max animate-marquee-brand"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>

      <style>{`
        @keyframes marquee-brand {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee-brand {
          animation: marquee-brand 90s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-brand { animation: none; }
        }
      `}</style>
    </section>
  );
}
