import Link from "next/link";
import { brandsRepo } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import { toyImage } from "@/app/utils/images";

export default async function TopBrands() {
  const brands = (await brandsRepo.list()).filter((b) => b.active);

  if (brands.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3 text-content">
          برندهای محبوب
        </h2>
        <p className="text-center text-sm sm:text-base text-content-muted mb-8 sm:mb-10">
          محبوب‌ترین برندهای اسباب‌بازی دنیا، یک‌جا
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href="/products"
              className="group bg-surface border border-border rounded-2xl p-5 sm:p-6 text-center shadow-sm hover:border-primary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all"
            >
              <div className="h-24 w-full overflow-hidden rounded-xl bg-surface-2">
                <img
                  src={toyImage("toys", 30 + brand.id * 7, 400, 400)}
                  alt={brand.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 text-base sm:text-lg font-extrabold text-content">
                {brand.name}
              </div>
              <div className="mt-1 text-sm text-content-muted">
                {toPersianNumber(brand.items)} کالا
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
