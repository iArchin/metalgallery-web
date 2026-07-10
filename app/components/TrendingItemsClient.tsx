"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Product } from "@/lib/types";
import SpotlightReviews from "@/app/components/SpotlightReviews";

const ROTATE_MS = 5000;

export default function TrendingItemsClient({ products }: { products: Product[] }) {
  const { add } = useCart();
  const feature = products.slice(0, 5);

  const [active, setActive] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (active > feature.length - 1) setActive(0);
  }, [active, feature.length]);

  // Auto-advance the spotlight; pauses on hover / reduced-motion. Resets on
  // every active change (including manual selection).
  useEffect(() => {
    if (paused || reduced || feature.length <= 1) return;
    const t = window.setTimeout(
      () => setActive((a) => (a + 1) % feature.length),
      ROTATE_MS
    );
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, feature.length]);

  if (feature.length === 0) return null;

  const p = feature[Math.min(active, feature.length - 1)];
  const off = discountPercent(p);
  const outOfStock = p.stock === 0;
  const added = addedId === p.id;
  const specs = Object.entries(p.specifications ?? {}).slice(0, 3);

  const handleAdd = () => {
    add({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      imageKeyword: p.imageKeyword,
      imageLock: p.imageLock,
    });
    setAddedId(p.id);
    window.setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 1500);
  };

  return (
    <section
      className="py-12 md:py-16 bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="site-container">
        {/* Header */}
        <div className="mb-8 text-center sm:text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            🔥 فروش داغ
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl 3xl:text-4xl font-extrabold text-content">
            تا <span className="text-primary">{toPersianNumber(50)}٪</span> تخفیف روی اسباب‌بازی‌های منتخب
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Featured spotlight — big, left on desktop. flex-col + flex-1 on the
              inner grid make the image and details fill the card's full height:
              the card is stretched by the taller rail beside it, so without this
              the content sits at the top and leaves a gap at the bottom. */}
          <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 flex-1">
              {/* Image. Square while stacked on mobile; once it sits beside the
                  details (sm+) the photo is absolutely positioned so it fills
                  whatever height the TEXT needs, instead of the text stretching
                  to match a giant square. That keeps the card only as tall as its
                  content — no towering image, no void, even padding all round. */}
              <div
                key={`img-${p.id}`}
                className="animate-spotlight relative aspect-square sm:aspect-auto overflow-hidden rounded-2xl bg-surface-2"
              >
                <img
                  src={productImage(p, 600, 600)}
                  alt={p.name}
                  className={`absolute inset-0 h-full w-full object-cover ${outOfStock ? "opacity-60 grayscale" : ""}`}
                />
                {off > 0 && (
                  <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-content shadow-md">
                    {toPersianNumber(off)}٪−
                  </span>
                )}
                {outOfStock && (
                  <span className="absolute top-3 left-3 rounded-full bg-content/80 px-2.5 py-1 text-xs font-bold text-background">
                    ناموجود
                  </span>
                )}
              </div>

              {/* Details */}
              <div key={`det-${p.id}`} className="animate-spotlight flex min-h-0 flex-col">
                <span className="text-xs font-bold text-primary">پیشنهاد ویژه</span>
                <Link href={`/product/${p.id}`} className="mt-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-content leading-snug hover:text-primary transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                </Link>

                <div className="mt-2 flex items-center gap-0.5 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(p.rating) ? "text-star" : "text-content-subtle"}>
                      ★
                    </span>
                  ))}
                  <span className="mr-1 text-xs text-content-muted">
                    ({toPersianNumber(p.reviewCount)} نظر)
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-content-muted line-clamp-3">
                  {p.description}
                </p>

                {/* Detail chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-bold text-content-muted">
                    {p.ageGroup}
                  </span>
                  {specs.map(([k, v]) => (
                    <span key={k} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-content-muted">
                      {k}: <span className="font-bold text-content">{v}</span>
                    </span>
                  ))}
                </div>

                {/* Rotating customer comments — fills the height beside the image */}
                <SpotlightReviews />

                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-content">
                      {formatPersianNumber(p.price)}
                      <span className="text-sm font-bold text-content-muted"> تومان</span>
                    </span>
                    {p.originalPrice && (
                      <span className="text-sm text-content-subtle line-through">
                        {formatPersianNumber(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={outOfStock}
                      onClick={handleAdd}
                    >
                      {outOfStock ? "ناموجود" : added ? "افزوده شد ✓" : "افزودن به سبد خرید"}
                    </Button>
                    <Link
                      href={`/product/${p.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-bold text-content-muted hover:text-primary hover:border-primary transition-colors"
                    >
                      جزئیات
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Rail — 3 selectable cards, right on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-1 flex flex-col gap-3">
            {feature.map((f, i) => {
              const fOff = discountPercent(f);
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 text-right transition-all ${
                    i === active
                      ? "border-primary bg-primary-soft/40 shadow-sm"
                      : "border-border bg-surface hover:border-primary/40 hover:bg-surface-2/50"
                  }`}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <img
                      src={productImage(f, 160, 160)}
                      alt={f.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {fOff > 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-center text-[10px] font-extrabold text-primary-content">
                        {toPersianNumber(fOff)}٪−
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-content line-clamp-1">{f.name}</div>
                    <div className="mt-0.5 text-xs font-bold text-content-muted">
                      {formatPersianNumber(f.price)} تومان
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-primary transition-opacity ${i === active ? "opacity-100" : "opacity-0"}`}
                    aria-hidden
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
