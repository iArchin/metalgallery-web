import type { Metadata } from "next";
import { galleryRepo } from "@/lib/server/repos";
import { toyImage } from "@/app/utils/images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گالری | متال گالری",
  description:
    "گالری تصاویر متال گالری؛ نگاهی به دنیای رنگارنگ اسباب‌بازی‌ها و محصولات فروشگاه ما.",
};

export default async function GalleryPage() {
  const items = (await galleryRepo.list()).filter((g) => g.active);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content">
          گالری متال گالری
        </h1>
        <p className="mt-3 text-sm sm:text-base text-content-muted">
          نگاهی به دنیای رنگارنگ محصولات ما
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-center text-content-muted py-16">
          فعلا تصویری در گالری ثبت نشده است.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <figure
              key={item.id}
              className="relative rounded-2xl overflow-hidden bg-surface-2 aspect-square group border border-border"
            >
              <img
                src={toyImage(item.imageKeyword, item.imageLock)}
                alt={item.caption}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 pt-8 text-white text-xs sm:text-sm font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
