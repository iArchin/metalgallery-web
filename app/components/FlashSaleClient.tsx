"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Product } from "@/lib/types";
import QuickLookModal from "@/app/components/QuickLookModal";

export default function FlashSaleClient({
  products,
}: {
  products: Product[];
}) {
  const { add } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);
  const [quickLookProduct, setQuickLookProduct] = useState<Product | null>(null);

  const handleAdd = (p: Product) => {
    add({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      imageKeyword: p.imageKeyword,
      imageLock: p.imageLock,
    });
    setAddedId(p.id);
    window.setTimeout(
      () => setAddedId((cur) => (cur === p.id ? null : cur)),
      1500
    );
  };

  // Repeat so one group is wide enough to fill the viewport, then render twice
  // and animate the track to -50% for a seamless, gapless infinite loop.
  const repeat = Math.max(2, Math.ceil(12 / products.length));
  const group = Array.from({ length: repeat }, () => products).flat();

  const card = (product: Product, i: number, duplicate: boolean) => {
    const off = discountPercent(product);
    const added = addedId === product.id;
    const outOfStock = product.stock === 0;
    return (
      <Link
        key={`${product.id}-${i}`}
        href={`/product/${product.id}`}
        tabIndex={duplicate ? -1 : undefined}
        className="group shrink-0 w-56 sm:w-64 bg-surface border border-border rounded-2xl p-4 shadow-sm transition-colors block"
      >
        <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-2xl bg-surface-2 mb-4">
          <img
            src={productImage(product)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {!outOfStock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickLookProduct(product);
              }}
              aria-label={`مشاهده سریع ${product.name}`}
              className="absolute bottom-2 left-2 h-9 w-9 inline-flex items-center justify-center rounded-full border border-border bg-surface/90 text-content hover:text-primary hover:border-primary hover:bg-surface backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {off > 0 && (
            <span className="absolute top-2 right-2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-content shadow-sm">
              {toPersianNumber(off)}٪ تخفیف
            </span>
          )}
        </div>
        <h3 className="font-semibold text-content mb-2 text-sm">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, s) => (
            <span
              key={s}
              className={s < Math.round(product.rating) ? "text-star" : "text-content-subtle"}
            >
              ★
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-content">
            {formatPersianNumber(product.price)} تومان
          </span>
          {product.originalPrice && (
            <span className="text-sm text-content-subtle line-through">
              {formatPersianNumber(product.originalPrice)}
            </span>
          )}
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            disabled={outOfStock}
            onClick={() => handleAdd(product)}
          >
            {outOfStock ? "ناموجود" : added ? "افزوده شد" : "افزودن به سبد خرید"}
          </Button>
        </div>
      </Link>
    );
  };

  const renderGroup = (duplicate: boolean) => (
    <div
      className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0"
      aria-hidden={duplicate || undefined}
    >
      {group.map((product, i) => card(product, i, duplicate))}
    </div>
  );

  return (
    <>
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Centered, stacked title + badge */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
              فروش ویژه!
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
              <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
              پیشنهاد محدود
            </span>
          </div>
        </div>

        {/* Hover-pausable infinite marquee. dir=ltr left-anchors the RTL track
            so the -50% loop stays gapless. */}
        <div
          dir="ltr"
          className="group/marquee relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        >
          <div className="flex w-max py-2 animate-flash-marquee group-hover/marquee:[animation-play-state:paused]">
            {renderGroup(false)}
            {renderGroup(true)}
          </div>
        </div>

        <style>{`
          @keyframes flash-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-flash-marquee {
            animation: flash-marquee 55s linear infinite;
            will-change: transform;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-flash-marquee { animation: none; }
          }
        `}</style>
      </section>

      {quickLookProduct && (
        <QuickLookModal
          product={quickLookProduct}
          open={!!quickLookProduct}
          onClose={() => setQuickLookProduct(null)}
        />
      )}
    </>
  );
}
