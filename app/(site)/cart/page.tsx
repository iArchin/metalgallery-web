import type { Metadata } from "next";
import CartClient from "@/app/(site)/cart/CartClient";

export const metadata: Metadata = {
  title: "سبد خرید | متال گالری",
  description:
    "سبد خرید شما در فروشگاه اسباب‌بازی متال گالری؛ مدیریت تعداد، حذف کالا، ثبت سفارش و دریافت کد پیگیری.",
};

export default function CartPage() {
  return <CartClient />;
}
