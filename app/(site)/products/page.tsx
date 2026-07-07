import { Suspense } from "react";
import { listProducts, categoriesRepo } from "@/lib/server/repos";
import ProductListing from "@/app/components/ProductListing";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, allCategories] = await Promise.all([
    listProducts(),
    categoriesRepo.list(),
  ]);
  const categories = allCategories.filter((c) => c.active);

  return (
    <main>
      <Suspense
        fallback={
          <div className="p-8 text-center text-content-muted">
            در حال بارگذاری...
          </div>
        }
      >
        <ProductListing products={products} categories={categories} />
      </Suspense>
    </main>
  );
}
