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
    <>
      {/*
        One full-bleed banner, the height of everything below the header — the
        page's own header stays in flow, so the hero is the viewport minus it:
        65px (h-16 + border) on mobile, 122px once the nav row appears at md.
        `svh` rather than `vh` so a mobile browser's collapsing URL bar cannot
        push the bottom of the image off screen on first paint.
      */}
      <section className="relative h-[calc(100svh-65px)] min-h-[30rem] w-full overflow-hidden bg-surface-2 md:h-[calc(100svh-122px)]">
        <HeroCarousel slides={slides} />
      </section>

      {/* The perks strip used to sit under the banner inside the same box. A
          full-height hero pushes it below the fold, so it becomes its own band
          — and it is what the doodle texture now sits behind. */}
      <section className="relative bg-background overflow-hidden">
        <HeroBackground />
        <div className="site-container relative w-full py-8 sm:py-10 3xl:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 3xl:gap-6">
            {perks.map((perk) => (
              <div
                key={perk.id}
                className="bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 3xl:p-6 flex items-center gap-3 sm:gap-4 shadow-sm transition-colors"
              >
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 3xl:h-14 3xl:w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {perk.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm 3xl:text-base font-bold text-content mb-0.5">
                    {perk.heading}
                  </div>
                  <div className="text-xs 3xl:text-sm text-content-muted">{perk.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
