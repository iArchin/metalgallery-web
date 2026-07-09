import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/server/auth";
import { listOrdersByPhone } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import OrderCard from "@/app/components/OrderCard";

export const metadata: Metadata = {
  title: "سفارش‌های من | متال گالری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/profile/orders");

  const orders = await listOrdersByPhone(customer.phone);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content">سفارش‌های من</h1>
          <p className="text-sm text-content-muted mt-1">
            {orders.length > 0
              ? `${toPersianNumber(orders.length)} سفارش`
              : "تاریخچه سفارش‌های شما"}
          </p>
        </div>
        <Link
          href="/profile"
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-bold text-content-muted hover:text-primary hover:border-primary transition-colors"
        >
          پروفایل
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-16 text-center text-sm text-content-muted">
          هنوز سفارشی ثبت نکرده‌اید.{" "}
          <Link href="/products" className="font-bold text-primary hover:underline">
            شروع خرید
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} detailed />
          ))}
        </div>
      )}
    </main>
  );
}
