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

  return (
    <>
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
            فروش ویژه!
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
            <span aria-hidden="true">🔥</span>
            پیشنهاد محدود
          </span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 sm:scroll-px-6">
        <div className="flex gap-4 sm:gap-6 pb-4 px-4 sm:px-6">
            {products.map((product) => {
              const off = discountPercent(product);
              const added = addedId === product.id;
              const outOfStock = product.stock === 0;
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group shrink-0 snap-start w-56 sm:w-64 bg-surface border border-border rounded-2xl p-4 shadow-sm transition-colors block"
                >
                  <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-2xl bg-surface-2 mb-4">
                    <img
                      src={productImage(product)}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {/* Quick Look button */}
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
                  <h3 className="font-semibold text-content mb-2 text-sm">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < Math.round(product.rating)
                            ? "text-star"
                            : "text-content-subtle"
                        }
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
                      {outOfStock
                        ? "ناموجود"
                        : added
                          ? "✓ اضافه شد"
                          : "افزودن به سبد خرید"}
                    </Button>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </section>

    {/* Quick Look Modal */}
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
