import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingActions from "@/app/components/FloatingActions";
import { CartProvider } from "@/app/components/CartContext";
import { getSettings, categoriesRepo } from "@/lib/server/repos";

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
  const [s, allCategories] = await Promise.all([getSettings(), categoriesRepo.list()]);
  const categories = allCategories
    .filter((c) => c.active)
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
