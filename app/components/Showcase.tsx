import ShowcaseRails from "@/app/components/ShowcaseRails";
import type { RailItem } from "@/app/components/ShowcaseRail";
import { categoriesRepo, listProducts } from "@/lib/server/repos";
import { productImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import { discountPercent, isDiscountActive } from "@/lib/types";

/**
 * Two stacked rails — a large row over a smaller one — in the shape of the
 * carousels Apple runs above its footer.
 *
 * Content is picked so the two rows are answering different questions rather
 * than repeating each other: the big row is "what should I look at", the small
 * one is "where do I go next".
 */
export default async function Showcase() {
  const [products, allCategories] = await Promise.all([
    listProducts(),
    categoriesRepo.list(),
  ]);

  // Big row: what the shop is pushing. Deals first, then trending, then the
  // newest — so the row is never empty on a shop that flags nothing.
  const featured = [
    ...products.filter((p) => p.isDeal),
    ...products.filter((p) => p.isTrending && !p.isDeal),
    ...products.filter((p) => !p.isDeal && !p.isTrending).sort((a, b) => b.id - a.id),
  ].slice(0, 10);

  const categories = allCategories.filter((c) => c.active);

  if (featured.length === 0 && categories.length === 0) return null;

  const featuredItems: RailItem[] = featured.map((p) => {
    const off = isDiscountActive(p) ? discountPercent(p) : 0;
    return {
      key: `p-${p.id}`,
      href: `/product/${p.id}`,
      title: p.name,
      subtitle: p.ageGroup || undefined,
      image: productImage(p),
      tag: off > 0 ? `${toPersianNumber(off)}٪ تخفیف` : undefined,
    };
  });

  const categoryItems: RailItem[] = categories
    .filter((c) => c.image?.trim())
    .map((c) => ({
      key: `c-${c.id}`,
      href: `/category/${c.id}`,
      title: c.name,
      image: c.image as string,
    }));

  return (
    <section className="bg-background py-12 md:py-16 3xl:py-20">
      {/* Full-bleed on purpose: the cards run to the edge of the viewport and
          the last one peeks, which is what signals the row scrolls. */}
      <ShowcaseRails featured={featuredItems} categories={categoryItems} />
    </section>
  );
}
