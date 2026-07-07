import Link from "next/link";
import { categoriesRepo } from "@/lib/server/repos";
import { toyImage } from "@/app/utils/images";

export default async function Categories() {
  const categories = (await categoriesRepo.list()).filter((c) => c.active);

  if (categories.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-8 sm:mb-12 text-content">
          دسته‌بندی‌های محبوب
        </h2>
        <div className="flex gap-5 sm:gap-10 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 justify-start sm:justify-center">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="shrink-0 snap-start flex flex-col items-center cursor-pointer group"
            >
              <div className="mb-3 sm:mb-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-active:translate-y-0">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-surface-2 border-4 border-border group-hover:border-primary shadow-sm group-hover:shadow-lg transition-all duration-300">
                  <img
                    src={toyImage(category.imageKeyword, category.imageLock)}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-content text-center transition-colors group-hover:text-primary group-active:text-primary">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
