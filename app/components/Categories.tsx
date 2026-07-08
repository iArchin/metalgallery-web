"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

const CATEGORY_IMAGES: Record<number, string> = {
  1: "/images/toy-kids-1.jpg",
  2: "/images/toy-kids-2.jpg",
  3: "/images/toy-kids-3.jpg",
  4: "/images/toy-kids-4.jpg",
  5: "/images/toy-kids-5.jpg",
  6: "/images/toy-hero.jpg",
};

export default function Categories({ categories }: { categories: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<number[]>([]);

  // Calculate U-curve offsets based on horizontal position relative to viewport center
  const calcOffsets = () => {
    const container = scrollRef.current;
    if (!container) return;
    const children = container.children;
    const viewCenter = window.innerWidth / 2;
    const maxOffset = 80; // px — max upward shift at edges

    const newOffsets: number[] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      // Distance from viewport center (0 = center, 1 = far edge)
      const dist = Math.abs(childCenter - viewCenter) / (viewCenter * 0.85);
      const clamped = Math.min(dist, 1);
      // Quadratic U-curve: items farther from center rise more dramatically
      newOffsets.push(-(clamped * clamped) * maxOffset);
    }
    setOffsets(newOffsets);
  };

  useEffect(() => {
    calcOffsets();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", calcOffsets, { passive: true });
    }
    window.addEventListener("resize", calcOffsets);
    return () => {
      container?.removeEventListener("scroll", calcOffsets);
      window.removeEventListener("resize", calcOffsets);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (categories.length === 0) return null;

  return (
    <section className="pt-24 pb-12 md:pt-28 md:pb-16 bg-background relative">
      {/* Top fade gradient */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-32 sm:h-44"
        style={{
          background: "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-0">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 sm:mb-8 text-content">
          دسته‌بندی‌های محبوب
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-0">
        <div
          ref={scrollRef}
          className="flex gap-8 sm:gap-24 no-scrollbar snap-x snap-mandatory pt-20 pb-6 justify-center"
          style={{ overflowX: "auto", overflowY: "visible" }}
        >
          {categories.map((category, i) => {
            const y = offsets[i] ?? 0;
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="shrink-0 snap-start flex flex-col items-center cursor-pointer group"
                style={{
                  transform: `translateY(${y}px)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <div className="mb-3 sm:mb-4">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-surface-2 border-4 border-border group-hover:border-primary shadow-sm transition-all duration-300">
                    <img
                      src={CATEGORY_IMAGES[category.id] || "/images/toy-banner.jpg"}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-content text-center transition-colors group-hover:text-primary">
                  {category.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
