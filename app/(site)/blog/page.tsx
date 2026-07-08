import type { Metadata } from "next";
import Link from "next/link";
import { articlesRepo } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import { toyImage } from "@/app/utils/images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بلاگ",
  description:
    "مقالات و راهنماهای متال گالری درباره انتخاب اسباب‌بازی، رشد کودک، ایمنی و دنیای کلکسیونری.",
  openGraph: {
    title: "بلاگ متال گالری | مقالات و راهنماهای اسباب‌بازی",
    description:
      "مقالات و راهنماهای متال گالری درباره انتخاب اسباب‌بازی، رشد کودک، ایمنی و دنیای کلکسیونری.",
  },
};

export default async function BlogPage() {
  const articles = (await articlesRepo.list()).filter((a) => a.published);
  const [featured, ...rest] = articles;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content">
          بلاگ متال گالری
        </h1>
        <p className="mt-2 text-sm sm:text-base text-content-muted">
          راهنمای خرید، نکات رشد کودک و دنیای اسباب‌بازی؛ هر هفته مطالب تازه
          بخوانید.
        </p>
      </header>

      {!featured ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-content-muted">
          هنوز مقاله‌ای منتشر نشده است.
        </div>
      ) : (
        <>
          {/* Featured article */}
          <Link
            href={`/blog/${featured.id}`}
            className="group grid md:grid-cols-2 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-colors mb-10 sm:mb-12"
          >
            <div className="h-56 sm:h-72 md:h-full overflow-hidden bg-surface-2">
              <img
                src={toyImage(featured.imageKeyword, featured.imageLock, 900, 600)}
                alt={featured.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5 sm:p-8 flex flex-col justify-center gap-3">
              <span className="self-start bg-primary-soft text-primary rounded-full px-3 py-1 text-xs font-bold">
                {featured.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-content leading-snug group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-sm sm:text-base text-content-muted leading-7">
                {featured.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-subtle">
                <span>{featured.date}</span>
                <span aria-hidden="true">·</span>
                <span>{featured.author}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {toPersianNumber(featured.readingMinutes)} دقیقه مطالعه
                </span>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary">
                ادامه مطلب
                <svg
                  className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </div>
          </Link>

          {/* Other articles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rest.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.id}`}
                className="group flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-colors"
              >
                <div className="h-44 overflow-hidden bg-surface-2">
                  <img
                    src={toyImage(a.imageKeyword, a.imageLock, 900, 600)}
                    alt={a.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
                  <span className="self-start bg-primary-soft text-primary rounded-full px-2.5 py-1 text-xs font-bold">
                    {a.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-content leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-content-muted leading-6 line-clamp-2">
                    {a.excerpt}
                  </p>
                  <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-subtle">
                    <span>{a.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{a.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{toPersianNumber(a.readingMinutes)} دقیقه مطالعه</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
