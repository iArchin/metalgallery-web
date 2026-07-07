"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiGet,
  Card,
  PageHeader,
  Badge,
  OrderStatusBadge,
  Table,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/app/admin/_components/ui";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import { formatPersianNumber, toPersianNumber } from "@/app/utils/numbers";

interface DashboardStats {
  productCount: number;
  activeProductCount: number;
  lowStock: { id: number; name: string; stock: number }[];
  orderCount: number;
  openOrderCount: number;
  revenue: number;
  unreadMessages: number;
  articleCount: number;
  recentOrders: Order[];
  statusBreakdown: { status: OrderStatus; count: number }[];
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-content-muted">{label}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
        {value}
        {suffix && <span className="text-sm font-bold text-content-muted mr-1.5">{suffix}</span>}
      </p>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardStats>("/api/dashboard")
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "خطای ناشناخته"));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="داشبورد" />
        <ErrorBlock message={error} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <PageHeader title="داشبورد" />
        <LoadingBlock />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="داشبورد" subtitle="نمای کلی فروشگاه در یک نگاه" />

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="درآمد کل" value={formatPersianNumber(stats.revenue)} suffix="تومان" />
        <StatCard label="سفارش‌های باز" value={toPersianNumber(stats.openOrderCount)} />
        <StatCard label="محصولات فعال" value={toPersianNumber(stats.activeProductCount)} />
        <StatCard label="پیام‌های خوانده‌نشده" value={toPersianNumber(stats.unreadMessages)} />
      </div>

      {/* status breakdown */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-content-muted">وضعیت سفارش‌ها:</span>
        {stats.statusBreakdown.map(({ status, count }) => (
          <Badge key={status} tone={count > 0 ? "primary" : "neutral"}>
            {ORDER_STATUS_LABELS[status]} · {toPersianNumber(count)}
          </Badge>
        ))}
      </div>

      {/* two-column: recent orders + low stock */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-content">آخرین سفارش‌ها</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">
              همه سفارش‌ها
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <Card>
              <EmptyState title="سفارشی ثبت نشده است" />
            </Card>
          ) : (
            <Table headers={["کد", "مشتری", "مبلغ", "وضعیت", "تاریخ"]}>
              {stats.recentOrders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-bold text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-content whitespace-nowrap">{o.customer.name}</td>
                  <td className="px-4 py-3 text-content whitespace-nowrap">
                    {formatPersianNumber(o.total)}{" "}
                    <span className="text-xs text-content-subtle">تومان</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-content">موجودی رو به اتمام</h2>
            <Link href="/admin/products" className="text-sm font-bold text-primary hover:underline">
              مدیریت محصولات
            </Link>
          </div>
          <Card className="p-2">
            {stats.lowStock.length === 0 ? (
              <EmptyState
                title="همه محصولات موجودی کافی دارند"
                subtitle="محصولی با موجودی کم وجود ندارد"
              />
            ) : (
              <ul className="divide-y divide-border">
                {stats.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href="/admin/products"
                      className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-surface-2 transition-colors min-h-[44px]"
                    >
                      <span className="text-sm font-bold text-content truncate">{p.name}</span>
                      <Badge tone={p.stock <= 2 ? "danger" : "neutral"}>
                        موجودی: {toPersianNumber(p.stock)}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
