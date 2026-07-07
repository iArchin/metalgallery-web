import type { Metadata } from "next";
import Link from "next/link";
import { getAboutContent } from "@/lib/server/repos";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درباره ما | متال گالری",
  description:
    "متال گالری؛ فروشگاه تخصصی اسباب‌بازی و اکشن فیگور از سال ۱۳۹۵ — ضمانت اصالت کالا، مشاوره تخصصی و پشتیبانی واقعی.",
};

const valueIcons = [
  <svg
    key="authenticity"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  </svg>,
  <svg
    key="safety"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>,
  <svg
    key="support"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  </svg>,
];

export default async function AboutPage() {
  const c = await getAboutContent();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      {/* Page header */}
      <header className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-content">
          {c.heroTitle}
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-content-muted">
          {c.heroText}
        </p>
      </header>

      {/* Story split */}
      <section className="mt-12 md:mt-16 grid md:grid-cols-2 gap-8 items-center">
        <div className="overflow-hidden rounded-2xl bg-surface-2 border border-border h-56 sm:h-72 md:h-80">
          <img
            src={toyImage(c.storyImageKeyword, c.storyImageLock, 900, 600)}
            alt={c.storyTitle}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-content">
            {c.storyTitle}
          </h2>
          <div className="mt-4 space-y-4 text-sm sm:text-base leading-7 text-content-muted">
            {c.storyParagraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-12 md:mt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {c.stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-2xl shadow-sm p-5 sm:p-6 text-center"
            >
              <div className="text-primary text-2xl sm:text-3xl font-extrabold" dir="ltr">
                {toPersianNumber(stat.value)}
              </div>
              <div className="mt-2 text-xs sm:text-sm text-content-muted leading-6">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mt-12 md:mt-16">
        <h2 className="text-xl sm:text-2xl font-extrabold text-content text-center">
          چرا خانواده‌ها به ما اعتماد می‌کنند؟
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {c.values.map((value, i) => (
            <div
              key={value.title}
              className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
                {valueIcons[i % valueIcons.length]}
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-bold text-content">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-content-muted">
                {value.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mt-12 md:mt-16">
        <div className="bg-primary rounded-2xl px-6 sm:px-10 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-content">
            {c.ctaTitle}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-primary-content/85 max-w-xl mx-auto leading-7">
            هزاران اسباب‌بازی و فیگور اورجینال منتظر شماست؛ همین حالا قفسه‌های
            متال گالری را ورق بزنید.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center gap-2 min-h-12 px-8 py-3 rounded-full bg-surface text-primary font-bold text-sm sm:text-base shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-content focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {c.ctaButton}
            <svg
              className="w-5 h-5 rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
