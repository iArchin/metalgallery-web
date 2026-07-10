import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingActions from "@/app/components/FloatingActions";
import { CartProvider } from "@/app/components/CartContext";
import { getSettings, categoriesRepo, listProducts } from "@/lib/server/repos";

// This layout reads the database (settings + categories for the chrome), so the
// whole (site) segment renders per request, not at build time. Keeps any static
// page under it — e.g. /login — from trying to reach Postgres during the build.
export const dynamic = "force-dynamic";

/**
 * Public site shell — every page under (site) gets the storefront chrome.
 * Individual pages must NOT render Navbar/Footer themselves.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [s, allCategories, products] = await Promise.all([
    getSettings(),
    categoriesRepo.list(),
    listProducts(),
  ]);
  // Only surface categories that actually have products, so no mega-menu link
  // lands on an empty listing.
  const usedCategoryIds = new Set(products.map((p) => p.categoryId));
  const categories = allCategories
    .filter((c) => c.active && usedCategoryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));
  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar settings={s} categories={categories} />
        <div className="flex-1">{children}</div>
        <Footer settings={s} />
      </div>
      <FloatingActions phone={s.phone} email={s.email} />
    </CartProvider>
  );
}
