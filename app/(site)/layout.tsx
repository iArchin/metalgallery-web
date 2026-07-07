import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingActions from "@/app/components/FloatingActions";
import { CartProvider } from "@/app/components/CartContext";
import { getSettings } from "@/lib/server/repos";

/**
 * Public site shell — every page under (site) gets the storefront chrome.
 * Individual pages must NOT render Navbar/Footer themselves.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings();
  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar settings={s} />
        <div className="flex-1">{children}</div>
        <Footer settings={s} />
      </div>
      <FloatingActions phone={s.phone} email={s.email} />
    </CartProvider>
  );
}
