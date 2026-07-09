import Link from "next/link";
import type { CSSProperties } from "react";
import type { Category } from "@/lib/types";

/**
 * Popular categories — a "corner" card: the category name sits in the top
 * corner and its artwork (a transparent PNG set in the admin, or an emoji
 * fallback) sits in the opposite bottom corner. Not a full-bleed image.
 */

const EMOJI: Record<string, string> = {
  toys: "🎁",
  "educational toy": "🧠",
  "outdoor kids toy": "🪁",
  "ride on toy": "🛴",
  "remote control car toy": "🕹️",
  "action figure": "🦸",
  doll: "🪆",
  "puzzle toy": "🧩",
  "building blocks": "🧱",
  "plush toy": "🧸",
  "board game": "🎲",
  "toy car": "🚗",
};

function emojiFor(keyword: string): string {
  return EMOJI[keyword?.trim().toLowerCase()] ?? "🧸";
}

export default function Categories({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-10 text-center">
          <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary mb-3">
            دسته‌بندی‌ها
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
            دسته‌بندی‌های محبوب
          </h2>
          <p className="text-sm sm:text-base text-content-muted mt-2">
            دنیای رنگارنگ اسباب‌بازی را کاوش کنید
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const img = cat.image?.trim();
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                aria-label={cat.name}
                className="group animate-tile-pop relative h-32 sm:h-36 overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
              >
                {/* soft accent glow behind the artwork corner */}
                <span
                  className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary/10 blur-xl"
                  aria-hidden
                />

                {/* name — top corner (top-right in RTL) */}
                <h3 className="absolute top-3.5 right-3.5 left-14 z-10 text-right text-sm sm:text-base font-extrabold leading-snug text-content transition-colors group-hover:text-primary">
                  {cat.name}
                </h3>

                {/* artwork / emoji — opposite bottom corner (bottom-left) */}
                <span className="absolute bottom-0 left-0 flex items-end p-2 sm:p-3">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="h-20 w-20 sm:h-24 sm:w-24 object-contain object-bottom-left drop-shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="text-5xl sm:text-6xl leading-none transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                    >
                      {emojiFor(cat.imageKeyword)}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
