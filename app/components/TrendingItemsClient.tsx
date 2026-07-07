"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Product } from "@/lib/types";

export default function TrendingItemsClient({
  products,
}: {
  products: Product[];
}) {
  const { add } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);

  const handleAdd = (p: Product) => {
    add({
      id: p.id,
      name: p.name,
      price: p.price,
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
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Promotional Banner */}
          <div className="md:col-span-1 min-h-[180px] md:min-h-0 bg-primary text-primary-content rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-white/15 text-white px-3 py-1 text-xs font-bold">
                  پیشنهاد ویژه
                </span>
                <div className="mt-4 text-4xl sm:text-5xl font-black">فروش</div>
                <p className="mt-2 text-sm font-medium text-white/85">
                  تا {toPersianNumber(50)}٪ تخفیف روی اسباب‌بازی‌های منتخب
                </p>
              </div>
              <div className="h-36 sm:h-40 w-full overflow-hidden rounded-xl bg-white/15">
                <img
                  src={toyImage("teddy bear toy", 21)}
                  alt="اسباب‌بازی خرسی پلوش با تخفیف ویژه"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="md:col-span-3">
            <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
              <div className="flex gap-4 sm:gap-6 pb-4">
                {products.map((product) => {
                  const off = discountPercent(product);
                  const added = addedId === product.id;
                  const outOfStock = product.stock === 0;
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="group shrink-0 snap-start w-56 sm:w-64 bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all block"
                    >
                      <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-2xl bg-surface-2 mb-4">
                        <img
                          src={toyImage(
                            product.imageKeyword,
                            product.imageLock
                          )}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
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
          </div>
        </div>
      </div>
    </section>
  );
}
