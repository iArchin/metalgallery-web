import Link from "next/link";
import { toPersianNumber } from "@/app/utils/numbers";
import { toyBanner, toyImage } from "@/app/utils/images";
import { getSettings } from "@/lib/server/repos";

export default async function Hero() {
  const settings = await getSettings();
  const hero = settings.hero;

  return (
    <section className="py-10 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Banner - image-led */}
          <div className="group md:col-span-2 relative overflow-hidden rounded-2xl h-[240px] sm:h-[280px] md:h-[300px] bg-surface-2 border border-border shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
            {/* full-bleed real photo */}
            <img
              src={toyBanner("toys shop", 71)}
              alt={hero.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* neutral overlay — text sits on the right in RTL */}
            <div
              className="absolute inset-0 bg-linear-to-l from-black/70 via-black/40 to-transparent"
              aria-hidden
            />

            <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-6 sm:p-10 text-white">
              <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-content">
                {toPersianNumber(hero.badgeText)}
              </span>
              <h2 className="mb-5 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
                {hero.title}
              </h2>
              <div>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-8 py-3 text-lg font-bold text-content border border-border cursor-pointer transition-all duration-200 active:scale-95 hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {hero.ctaText}
                </Link>
              </div>
            </div>
          </div>

          {/* Smaller Banner - neutral surface card with side photo */}
          <div className="group relative overflow-hidden rounded-2xl h-[240px] sm:h-[280px] md:h-[300px] bg-surface border border-border shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex h-full">
              {/* copy — right side in RTL */}
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                <div className="text-xl sm:text-2xl font-extrabold text-content mb-2">
                  {hero.sideTitle}
                </div>
                <p className="text-sm sm:text-base font-semibold text-content-muted mb-5 leading-relaxed">
                  {toPersianNumber(hero.sideText)}
                </p>
                <div>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-base font-bold text-primary-content shadow-sm shadow-primary/30 cursor-pointer transition-all duration-200 active:scale-95 hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    {hero.sideCtaText}
                  </Link>
                </div>
              </div>

              {/* real photo — left side in RTL */}
              <div className="relative w-2/5 shrink-0 overflow-hidden bg-surface-2">
                <img
                  src={toyImage("action figure", 12)}
                  alt={hero.sideTitle}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
