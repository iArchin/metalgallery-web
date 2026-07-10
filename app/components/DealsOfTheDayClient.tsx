"use client";

import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Product } from "@/lib/types";
import QuickLookModal from "@/app/components/QuickLookModal";

export default function DealsOfTheDayClient({
  products,
}: {
  products: Product[];
}) {
  const { add } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);
  const [quickLookProduct, setQuickLookProduct] = useState<Product | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 23,
    hours: 0,
    minutes: 10,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  /* ---- horizontal rail: chevron buttons + drag-to-scroll ---------------- */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const [dragging, setDragging] = useState(false);

  /** dir=+1 scrolls toward the start (right, in RTL); dir=-1 toward the end. */
  const scrollByAmount = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Touch/pen keep native momentum scrolling; only mouse needs drag support.
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
  };

  // A drag that moved shouldn't also "click" the product card underneath.
  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragRef.current.moved = 0;
  };

  const timeUnits = [
    { label: "ثانیه", value: timeLeft.seconds },
    { label: "دقیقه", value: timeLeft.minutes },
    { label: "ساعت", value: timeLeft.hours },
    { label: "روز", value: timeLeft.days },
  ];

  return (
    <>
    <section className="py-12 md:py-16 bg-background">
      <div className="site-container">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-8 md:mb-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-bold text-primary mb-3">
              حراج ویژه
            </span>
            <h2 className="text-2xl sm:text-3xl 3xl:text-4xl font-extrabold text-content">
              پیشنهادات روز
            </h2>
          </div>
          <div className="flex items-start gap-1.5 sm:gap-2">
            {timeUnits.map((unit, i) => (
              <div key={unit.label} className="flex items-start gap-1.5 sm:gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-center shadow-sm">
                    <div className="text-lg sm:text-2xl font-extrabold text-content tabular-nums">
                      {toPersianNumber(String(unit.value).padStart(2, "0"))}
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-content-muted font-medium">
                    {unit.label}
                  </span>
                </div>
                {i < timeUnits.length - 1 && (
                  <span className="text-lg sm:text-2xl font-bold text-primary mt-3 sm:mt-4">
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The md+ side padding is the chevrons' gutter — the scroll area starts
          after it, so cards never slide underneath the buttons. */}
      <div className="relative md:px-16 lg:px-20">
        {/* Prev (toward the start = right, in RTL) */}
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="محصولات قبلی"
          className="hidden md:grid absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-10 h-12 w-12 place-items-center rounded-full border-2 border-border-strong bg-surface text-content shadow-lg transition-all hover:bg-primary hover:text-primary-content hover:border-primary active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Next (toward the end = left, in RTL) */}
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="محصولات بعدی"
          className="hidden md:grid absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-10 h-12 w-12 place-items-center rounded-full border-2 border-border-strong bg-surface text-content shadow-lg transition-all hover:bg-primary hover:text-primary-content hover:border-primary active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          style={{ scrollSnapType: dragging ? "none" : undefined }}
          className={`overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 ${
            dragging ? "cursor-grabbing select-none" : "md:cursor-grab"
          }`}
        >
          <div className="flex gap-4 sm:gap-6 pb-4 px-4 sm:px-6 md:px-0">
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
                  <h3 className="font-bold text-content mb-2 text-sm">
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
                          ? "افزوده شد"
                          : "افزودن به سبد خرید"}
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
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
