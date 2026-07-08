import type { Metadata } from "next";
import Link from "next/link";
import { newsRepo } from "@/lib/server/repos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "اخبار",
  description:
    "تازه‌ترین اخبار و اطلاعیه‌های فروشگاه اسباب‌بازی متال گالری؛ جشنواره‌ها، محصولات جدید و خدمات تازه.",
  openGraph: {
    title: "اخبار متال گالری | جشنواره‌ها و اطلاعیه‌ها",
    description:
      "تازه‌ترین اخبار و اطلاعیه‌های فروشگاه اسباب‌بازی متال گالری",
  },
};

export default async function NewsPage() {
  const items = (await newsRepo.list()).filter((n) => n.published);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      {/* Header */}
      <header className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content">
          اخبار فروشگاه
        </h1>
        <p className="mt-3 text-sm sm:text-base text-content-muted leading-7">
          آخرین اطلاعیه‌ها، جشنواره‌ها و خبرهای مهم متال گالری را این‌جا دنبال
          کنید.
        </p>
      </header>

      {/* News list */}
      <div className="max-w-3xl mx-auto space-y-4">
        {items.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-content-muted">
            فعلاً خبری منتشر نشده است.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-primary-soft text-primary text-xs font-bold rounded-full px-2.5 py-1">
                  {item.tag}
                </span>
                <time className="text-content-subtle text-xs">{item.date}</time>
              </div>
              <h2 className="text-content font-bold text-base sm:text-lg mb-2">
                {item.title}
              </h2>
              <p className="text-content-muted text-sm leading-7">{item.body}</p>
            </article>
          ))
        )}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-3xl mx-auto mt-10 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center min-h-10 px-4 py-2 text-sm font-bold text-primary hover:underline active:opacity-80 transition-colors"
        >
          مقالات آموزشی ما را هم بخوانید ←
        </Link>
      </div>
    </main>
  );
}
