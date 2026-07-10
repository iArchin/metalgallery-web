import Link from "next/link";
import { toPersianNumber } from "@/app/utils/numbers";
import { getSettings } from "@/lib/server/repos";
import type { HeroSlide } from "@/lib/types";
import HeroBackground from "@/app/components/HeroBackground";
import HeroCarousel from "@/app/components/HeroCarousel";

const perks = [
  {
    id: 1,
    heading: "بازگشت و بازپرداخت",
    title: "ضمانت بازگشت وجه",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 2,
    heading: "پرداخت امن",
    title: "۱۰۰% ایمن و مطمئن",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: 3,
    heading: "پشتیبانی با کیفیت",
    title: "همیشه آنلاین ۲۴/۷",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 4,
    heading: "پیشنهادات روزانه",
    title: `${toPersianNumber("20%")} تخفیف با عضویت`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-7-4v16" />
      </svg>
    ),
  },
];

export default async function Hero() {
  const settings = await getSettings();
  const hero = settings.hero;

  // Big banner rotates through the admin-managed slides; fall back to a single
  // slide built from the legacy hero fields so the banner is never empty.
  const activeSlides = (settings.heroSlides ?? []).filter((s) => s.active);
  const slides: HeroSlide[] =
    activeSlides.length > 0
      ? activeSlides
      : [
          {
            id: 0,
            badgeText: hero.badgeText,
            title: hero.title,
            subtitle: "",
            ctaText: hero.ctaText,
            ctaHref: "/products",
            image: "/images/toy-hero.jpg",
            active: true,
          },
        ];

  return (
    <section className="min-h-screen relative bg-background overflow-hidden flex flex-col justify-center pt-8 pb-24 md:pt-12 md:pb-36 3xl:pb-48">
      {/* Toy doodle background */}
      <HeroBackground />
      <div className="site-container w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Large Banner — auto-rotating carousel of admin-managed slides.
              translateZ(0) puts the rounded clip on its own GPU layer so the
              inner Ken-Burns zoom composites smoothly (no per-frame re-clip). */}
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl h-[300px] sm:h-[360px] md:h-[420px] 3xl:h-[60vh] 4xl:h-[72vh] 5xl:h-[80vh] bg-surface-2 border border-border shadow-sm transition-colors transform-[translateZ(0)]">
            <HeroCarousel slides={slides} />
          </div>

          {/* Smaller Banner — full-bleed image with overlaid text, like the
              carousel slides but static (single image, no rotation). */}
          <div className="group relative overflow-hidden rounded-2xl h-[300px] sm:h-[360px] md:h-[420px] 3xl:h-[60vh] 4xl:h-[72vh] 5xl:h-[80vh] bg-surface-2 border border-border shadow-sm transition-colors">
            <img
              src="/images/toy-kids-1.jpg"
              alt={hero.sideTitle}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-l from-black/75 via-black/45 to-transparent" aria-hidden />
            <div className="relative z-10 flex h-full max-w-xs flex-col justify-center p-6 sm:p-8 text-white">
              <h2 className="mb-3 text-xl sm:text-2xl font-extrabold leading-snug">
                {hero.sideTitle}
              </h2>
              <p className="mb-5 text-sm sm:text-base font-semibold text-white/85 leading-relaxed">
                {toPersianNumber(hero.sideText)}
              </p>
              <div>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-2.5 text-base font-bold text-content border border-border cursor-pointer transition-all duration-200 active:scale-95 hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                >
                  {hero.sideCtaText}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Perks Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {perks.map((perk) => (
            <div
              key={perk.id}
              className="bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm transition-colors"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {perk.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-content mb-0.5">{perk.heading}</div>
                <div className="text-xs text-content-muted">{perk.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
