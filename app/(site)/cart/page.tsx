import type { Metadata } from "next";
import CartClient from "@/app/(site)/cart/CartClient";

export const metadata: Metadata = {
  title: "سبد خرید",
  description:
    "سبد خرید شما در فروشگاه اسباب‌بازی متال گالری؛ مدیریت تعداد، حذف کالا، ثبت سفارش و دریافت کد پیگیری.",
  robots: { index: false, follow: false },
};

// The (site) layout reads live settings; without this the route (and its
// chrome) would be frozen at build time.
export const dynamic = "force-dynamic";

export default function CartPage() {
  return <CartClient />;
}
