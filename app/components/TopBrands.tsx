"use client";

import Link from "next/link";
import type { Brand } from "@/lib/types";

export default function TopBrands({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  // Fill enough copies to cover 2x viewport width seamlessly
  const copies = Math.max(10, Math.ceil(40 / brands.length));
  const items = Array.from({ length: copies }, () => brands).flat();

  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3 text-content">
          برندهای محبوب
        </h2>
        <p className="text-center text-sm sm:text-base text-content-muted">
          محبوب‌ترین برندهای اسباب‌بازی دنیا، یک‌جا
        </p>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_10%,black_90%,transparent)]">
        <div className="flex gap-4 sm:gap-6 animate-marquee-brand w-max">
          {items.map((brand, i) => (
            <Link
              key={`${brand.id}-${i}`}
              href="/products"
              className="shrink-0 flex flex-col items-center gap-2 sm:gap-3 group/brand"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-surface-2 border-2 border-border group-hover/brand:border-primary shadow-sm transition-all">
                <img
                  src="/images/toy-kids-5.jpg"
                  alt={brand.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-sm sm:text-base font-semibold text-content text-center group-hover/brand:text-primary transition-colors">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-brand {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / ${copies})); }
        }
        .animate-marquee-brand {
          animation: marquee-brand 25s linear infinite;
        }
        .animate-marquee-brand:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
