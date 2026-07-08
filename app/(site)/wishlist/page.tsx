import type { Metadata } from "next";
import { listProducts } from "@/lib/server/repos";
import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description:
    "لیست علاقه‌مندی‌های شما در متال گالری؛ محصولات مورد علاقه خود را ذخیره کنید و بعدا به سبد خرید اضافه کنید.",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const products = await listProducts();
  return <WishlistClient products={products} />;
}
