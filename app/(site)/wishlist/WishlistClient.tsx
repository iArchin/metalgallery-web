"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";

const STORAGE_KEY = "mg_wishlist_v1";
const DEFAULT_IDS = [3, 5, 13, 14];

function loadWishlist(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_IDS));
      return DEFAULT_IDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is number => typeof v === "number");
    }
    return [];
  } catch {
    return [];
  }
}

function saveWishlist(ids: number[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export default function WishlistClient({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [ids, setIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  useEffect(() => {
    // Hydrating client state from localStorage after mount is the standard
    // SSR-safe pattern for external stores (server can't read localStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(loadWishlist());
    setLoaded(true);
  }, []);

  const removeItem = (id: number) => {
    setIds((prev) => {
      const next = prev.filter((v) => v !== id);
      saveWishlist(next);
      return next;
    });
  };

  const handleAdd = (product: Product) => {
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      imageKeyword: product.imageKeyword,
      imageLock: product.imageLock,
      stock: product.stock,
    });
    setAddedIds((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
    window.setTimeout(() => {
      setAddedIds((prev) => prev.filter((v) => v !== product.id));
    }, 1600);
  };

  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content">
          علاقه‌مندی‌های من
        </h1>
        <p className="mt-2 text-sm sm:text-base text-content-muted">
          {!loaded
            ? "در حال بارگذاری لیست شما..."
            : items.length > 0
              ? `${toPersianNumber(items.length)} محصول در لیست شما ذخیره شده است`
              : "هنوز محصولی ذخیره نکرده‌اید"}
        </p>
      </header>

      {!loaded ? null : items.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl shadow-sm py-16 px-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-content mb-2">
            لیست علاقه‌مندی‌ها خالی است
          </h2>
          <p className="text-sm text-content-muted mb-6 max-w-md">
            محصولات مورد علاقه خود را با لمس آیکون قلب ذخیره کنید تا بعدا راحت‌تر
            پیدایشان کنید.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              مشاهده محصولات
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item) => {
            const isAdded = addedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-3 sm:p-4 flex flex-col"
              >
                <Link
                  href={`/product/${item.id}`}
                  className="block h-36 sm:h-48 rounded-xl overflow-hidden bg-surface-2 mb-3"
                >
                  <img
                    src={toyImage(item.imageKeyword, item.imageLock)}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </Link>

                <Link
                  href={`/product/${item.id}`}
                  className="block text-xs sm:text-sm font-bold text-content hover:text-primary transition-colors line-clamp-2 min-h-10 mb-1"
                >
                  {item.name}
                </Link>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-sm sm:text-base font-bold text-content">
                    {formatPersianNumber(item.price)} تومان
                  </span>
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <span className="text-xs text-content-subtle line-through">
                      {formatPersianNumber(item.originalPrice)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAdd(item)}
                  >
                    {isAdded ? "افزوده شد ✓" : "افزودن به سبد"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`حذف ${item.name} از علاقه‌مندی‌ها`}
                    className="shrink-0 w-10 h-10 flex items-center justify-center border border-border rounded-full text-primary hover:bg-primary-soft active:bg-primary-soft active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
