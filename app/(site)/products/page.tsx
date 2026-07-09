import { Suspense } from "react";
import type { Metadata } from "next";
import { listProducts, categoriesRepo } from "@/lib/server/repos";
import ProductListing from "@/app/components/ProductListing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "محصولات",
  description:
    "مشاهده همه محصولات متال گالری - اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه",
  openGraph: {
    title: "محصولات متال گالری | اسباب‌بازی، اکشن فیگور و ماکت",
    description:
      "مشاهده همه محصولات با بهترین قیمت و تخفیف ویژه",
  },
};

export default async function ProductsPage() {
  const [products, allCategories] = await Promise.all([
    listProducts(),
    categoriesRepo.list(),
  ]);
  const categories = allCategories.filter((c) => c.active);
  // Disabling a category also removes its products from the storefront.
  const activeCatIds = new Set(categories.map((c) => c.id));
  const visibleProducts = products.filter((p) => activeCatIds.has(p.categoryId));

  return (
    <main>
      <Suspense
        fallback={
          <div className="p-8 text-center text-content-muted">
            در حال بارگذاری...
          </div>
        }
      >
        <ProductListing products={visibleProducts} categories={categories} />
      </Suspense>
    </main>
  );
}
