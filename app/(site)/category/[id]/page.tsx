import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categoriesRepo, listProducts } from "@/lib/server/repos";
import ProductListing from "@/app/components/ProductListing";

// Reads the database on every request, like every other (site) route.
export const dynamic = "force-dynamic";

const BASE_URL = "https://metalgallery.ir";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

/**
 * The route segment is a category id and nothing else. Parsing strictly matters
 * here: an unguarded parseInt would hand `NaN` to an integer column, which
 * Postgres rejects with a 500 instead of the 404 a bad URL deserves.
 */
function parseCategoryId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const categoryId = parseCategoryId(id);
  const category = categoryId ? await categoriesRepo.get(categoryId) : undefined;
  if (!category || !category.active) {
    return { title: "دسته‌بندی یافت نشد" };
  }
  const description = `خرید ${category.name} از متال گالری با بهترین قیمت، تخفیف ویژه و ضمانت اصالت کالا.`;
  return {
    title: category.name,
    description,
    // The same products are still reachable at /products?category=<id>; this
    // page is the canonical one so the two do not compete in search results.
    alternates: { canonical: `${BASE_URL}/category/${category.id}` },
    openGraph: {
      title: `${category.name} | متال گالری`,
      description,
      type: "website",
      images: category.image ? [{ url: category.image, alt: category.name }] : [],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const categoryId = parseCategoryId(id);
  if (categoryId === null) notFound();

  const [category, allCategories, products] = await Promise.all([
    categoriesRepo.get(categoryId),
    categoriesRepo.list(),
    listProducts(),
  ]);

  // A deactivated category is off the storefront entirely — same rule the shop
  // applies when it hides a disabled category's products.
  if (!category || !category.active) notFound();

  const categories = allCategories.filter((c) => c.active);
  const items = products.filter((p) => p.categoryId === category.id);

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <nav aria-label="مسیر صفحه" className="text-xs sm:text-sm text-content-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                خانه
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:text-primary transition-colors">
                فروشگاه
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-content font-semibold">{category.name}</li>
          </ol>
        </nav>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center text-content-muted">در حال بارگذاری...</div>
        }
      >
        <ProductListing
          products={items}
          categories={categories}
          heading={category.name}
          lockedCategoryId={category.id}
        />
      </Suspense>
    </main>
  );
}
