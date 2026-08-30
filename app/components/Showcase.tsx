import ShowcaseRails from "@/app/components/ShowcaseRails";
import type { RailItem } from "@/app/components/ShowcaseRail";
import { categoriesRepo, getSettings, listProducts } from "@/lib/server/repos";
import { productImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import { discountPercent, isDiscountActive, type ShowcaseCard } from "@/lib/types";

/**
 * Two stacked rails on the home page.
 *
 * Content comes from the panel when the admin has curated it, and falls back to
 * an automatic selection otherwise — a shop that has never opened this settings
 * page still gets a populated section rather than a hole in the layout.
 */

function fromCards(cards: ShowcaseCard[]): RailItem[] {
  return cards
    .filter((c) => c.image?.trim())
    .map((c) => ({
      key: `s-${c.id}`,
      href: c.href || "/products",
      title: c.title,
      subtitle: c.subtitle || undefined,
      image: c.image,
      cta: c.cta || "مشاهده",
      tag: c.tag || undefined,
    }));
}

export default async function Showcase() {
  const [settings, products, allCategories] = await Promise.all([
    getSettings(),
    listProducts(),
    categoriesRepo.list(),
  ]);

  const curatedTop = fromCards(settings.showcaseTop ?? []);
  const curatedBottom = fromCards(settings.showcaseBottom ?? []);

  // Automatic fallback for the wide row: deals, then trending, then newest, so
  // it is never empty on a shop that flags nothing.
  const featured = [
    ...products.filter((p) => p.isDeal),
    ...products.filter((p) => p.isTrending && !p.isDeal),
    ...products.filter((p) => !p.isDeal && !p.isTrending).sort((a, b) => b.id - a.id),
  ].slice(0, 8); // one dot per card, so the indicator row stays compact

  const autoTop: RailItem[] = featured.map((p) => {
    const off = isDiscountActive(p) ? discountPercent(p) : 0;
    return {
      key: `p-${p.id}`,
      href: `/product/${p.id}`,
      title: p.name,
      subtitle: p.ageGroup || undefined,
      image: productImage(p),
      cta: "مشاهده محصول",
      tag: off > 0 ? `${toPersianNumber(off)}٪ تخفیف` : undefined,
    };
  });

  const autoBottom: RailItem[] = allCategories
    .filter((c) => c.active && c.image?.trim())
    .map((c) => ({
      key: `c-${c.id}`,
      href: `/category/${c.id}`,
      title: c.name,
      image: c.image as string,
      cta: "دیدن",
    }));

  const top = curatedTop.length > 0 ? curatedTop : autoTop;
  const bottom = curatedBottom.length > 0 ? curatedBottom : autoBottom;

  if (top.length === 0 && bottom.length === 0) return null;

  return (
    <section className="overflow-hidden bg-background py-12 md:py-16 3xl:py-20">
      <ShowcaseRails
        featured={top}
        categories={bottom}
        heading={settings.showcaseHeading?.trim() || "سرگرمی بی‌پایان"}
      />
    </section>
  );
}
