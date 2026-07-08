"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { formatPersianNumber, toPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Product } from "@/lib/types";

interface QuickLookModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export default function QuickLookModal({ product, open, onClose }: QuickLookModalProps) {
  const { add } = useCart();
  const [addedMessage, setAddedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "specs">("desc");

  // Animation state: "entering" | "visible" | "exiting" | "hidden"
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting" | "hidden">("hidden");
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const off = discountPercent(product);
  const outOfStock = product.stock <= 0;

  // Manage enter / exit animation phases
  useEffect(() => {
    if (animTimer.current) clearTimeout(animTimer.current);
    if (open) {
      // Mount instantly, then trigger enter on the next frame for CSS transition
      setPhase("entering");
      animTimer.current = setTimeout(() => setPhase("visible"), 20);
    } else if (phase !== "hidden") {
      setPhase("exiting");
      animTimer.current = setTimeout(() => setPhase("hidden"), 250);
    }
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Lock body scroll while visible
  useEffect(() => {
    if (phase !== "hidden") {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Only restore scroll if no other modal is open
      if (phase !== "hidden") {
        document.body.style.overflow = "";
      }
    };
  }, [phase, handleKeyDown]);

  // Restore scroll when fully hidden
  useEffect(() => {
    if (phase === "hidden") {
      document.body.style.overflow = "";
    }
  }, [phase]);

  const handleAddToCart = () => {
    if (outOfStock) return;
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      imageKeyword: product.imageKeyword,
      imageLock: product.imageLock,
      stock: product.stock,
    });
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  if (phase === "hidden") return null;

  const isVisible = phase === "visible";
  const hasSpecs = Object.keys(product.specifications).length > 0;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop — fades in/out quickly, no scale animation */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card — fades + scales */}
      <div
        className={`relative bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto transition-all duration-300 ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="بستن"
          className="absolute top-4 left-4 z-10 h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface/90 text-content hover:text-primary hover:border-primary backdrop-blur-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image Section */}
          <div className="relative h-72 sm:h-80 md:h-full min-h-80 bg-surface-2 overflow-hidden rounded-t-3xl md:rounded-t-none md:rounded-r-3xl">
            <img
              src={productImage(product, 1000, 1000)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {off > 0 && !outOfStock && (
              <span className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-content shadow-md">
                ٪{toPersianNumber(off.toString())} تخفیف
              </span>
            )}
            {outOfStock && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="rounded-full bg-surface border border-border px-4 py-2 text-sm font-bold text-content shadow-md">
                  ناموجود
                </span>
              </span>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 flex flex-col">
            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-content mb-3">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${i < Math.round(product.rating) ? "text-star" : "text-content-subtle"}`}
                >
                  ★
                </span>
              ))}
              <span className="text-sm text-content-muted mr-2">
                ({toPersianNumber(product.reviewCount.toString())})
              </span>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-content">
                {formatPersianNumber(product.price)} تومان
              </span>
              {off > 0 && product.originalPrice && (
                <>
                  <span className="text-lg text-content-subtle line-through">
                    {formatPersianNumber(product.originalPrice)} تومان
                  </span>
                  <span className="bg-primary-soft text-primary px-2.5 py-1 rounded-full text-sm font-semibold">
                    ٪{toPersianNumber(off.toString())}
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mb-5">
              {!outOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-mint font-semibold">
                  <span className="w-2 h-2 bg-mint rounded-full" />
                  موجود در انبار
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  ناموجود
                </span>
              )}
            </div>

            {/* Mini Tabs: Description / Specs */}
            <div className="border-t border-border pt-5 flex-1">
              <div className="flex gap-6 mb-4 border-b border-border pb-2">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`text-sm font-semibold pb-2 -mb-[2px] border-b-2 transition-colors ${
                    activeTab === "desc"
                      ? "border-primary text-primary"
                      : "border-transparent text-content-muted hover:text-content"
                  }`}
                >
                  توضیحات
                </button>
                {hasSpecs && (
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`text-sm font-semibold pb-2 -mb-[2px] border-b-2 transition-colors ${
                      activeTab === "specs"
                        ? "border-primary text-primary"
                        : "border-transparent text-content-muted hover:text-content"
                    }`}
                  >
                    مشخصات
                  </button>
                )}
              </div>

              {activeTab === "desc" && (
                <p className="text-sm sm:text-base text-content-muted leading-relaxed">
                  {product.description}
                </p>
              )}

              {activeTab === "specs" && hasSpecs && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm border-b border-border pb-3 last:border-0">
                      <span className="font-semibold text-content shrink-0">{key}:</span>
                      <span className="text-content-muted">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-5 mt-5 flex flex-col sm:flex-row gap-3">
              <Button
                variant={addedMessage ? "accent" : "primary"}
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                {outOfStock ? "ناموجود" : addedMessage ? "✓ افزوده شد" : "افزودن به سبد خرید"}
              </Button>
              <Link
                href={`/product/${product.id}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 font-bold transition-colors rounded-full px-6 py-3 text-sm bg-surface text-content border border-border hover:bg-surface-2 hover:border-border-strong"
              >
                مشاهده محصول
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
