"use client";

import { useEffect, useState } from "react";

export interface SpotlightComment {
  name: string;
  text: string;
  rating: number;
}

// Placeholder testimonials. There is no per-product review data yet (products
// only carry a reviewCount), so these are generic samples — replace them with
// real customer reviews before relying on them. Pass `comments` to override.
const PLACEHOLDER: SpotlightComment[] = [
  { name: "زهرا محمدی", text: "کیفیت عالی و بسته‌بندی بی‌نقص بود، بچه‌ام عاشقش شد!", rating: 5 },
  { name: "علی رضایی", text: "ارسال سریع و محصول دقیقاً مطابق تصویر. پیشنهاد می‌کنم.", rating: 5 },
  { name: "مریم احمدی", text: "قیمت منصفانه و جنس مرغوب، حتماً باز هم خرید می‌کنم.", rating: 4 },
  { name: "حسین کریمی", text: "پشتیبانی خوب و تحویل به‌موقع، از خریدم کاملاً راضی‌ام.", rating: 5 },
];

const ROTATE_MS = 4000;

export default function SpotlightReviews({
  comments = PLACEHOLDER,
}: {
  comments?: SpotlightComment[];
}) {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance; pauses under reduced-motion or with a single comment.
  useEffect(() => {
    if (reduced || comments.length <= 1) return;
    const t = window.setTimeout(
      () => setI((n) => (n + 1) % comments.length),
      ROTATE_MS
    );
    return () => window.clearTimeout(t);
  }, [i, reduced, comments.length]);

  if (comments.length === 0) return null;
  const c = comments[i % comments.length];

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface-2/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-primary">نظرات مشتریان</span>
        <div className="flex gap-1" aria-hidden>
          {comments.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                n === i ? "w-4 bg-primary" : "w-1.5 bg-border-strong"
              }`}
            />
          ))}
        </div>
      </div>

      {/* key={i} re-triggers the fade/slide on every rotation */}
      <div key={i} className="animate-spotlight flex min-h-0 flex-1 flex-col">
        <div className="mb-1 flex gap-0.5 text-sm">
          {Array.from({ length: 5 }).map((_, s) => (
            <span key={s} className={s < c.rating ? "text-star" : "text-content-subtle"}>
              ★
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-content-muted line-clamp-3">
          «{c.text}»
        </p>
        <div className="mt-auto pt-2 text-xs font-bold text-content">— {c.name}</div>
      </div>
    </div>
  );
}
