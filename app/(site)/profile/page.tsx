import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/server/auth";
import { listOrdersByPhone } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import OrderCard from "@/app/components/OrderCard";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = {
  title: "پروفایل من | متال گالری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/profile");

  const orders = await listOrdersByPhone(customer.phone);
  const recent = orders.slice(0, 3);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-content mb-1">پروفایل من</h1>
      <p className="text-sm text-content-muted mb-6 sm:mb-8">
        نام، تصویر و آدرس تحویل خود را مدیریت کنید. این اطلاعات هنگام ثبت سفارش استفاده می‌شود.
      </p>

      <ProfileForm customer={customer} />

      {/* Order history — collapsible dropdown with a link to the full page */}
      <section className="mt-8">
        {orders.length === 0 ? (
          <>
            <h2 className="text-lg font-extrabold text-content mb-4">سفارش‌های من</h2>
            <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-content-muted">
              هنوز سفارشی ثبت نکرده‌اید.{" "}
              <Link href="/products" className="font-bold text-primary hover:underline">
                شروع خرید
              </Link>
            </div>
          </>
        ) : (
          <details className="group bg-surface border border-border rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between gap-2 cursor-pointer select-none px-5 py-4 list-none [&::-webkit-details-marker]:hidden">
              <span className="font-extrabold text-content">
                سفارش‌های من{" "}
                <span className="text-content-muted font-bold">({toPersianNumber(orders.length)})</span>
              </span>
              <svg
                className="h-5 w-5 text-content-muted transition-transform duration-300 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
              {recent.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
              <Link
                href="/profile/orders"
                className="flex items-center justify-center gap-1 rounded-xl bg-surface-2 py-2.5 text-sm font-bold text-primary hover:bg-surface-3 transition-colors"
              >
                مشاهده همه سفارش‌ها
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" />
                </svg>
              </Link>
            </div>
          </details>
        )}
      </section>
    </main>
  );
}
