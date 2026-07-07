"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import {
  apiGet,
  PageHeader,
  Table,
  OrderStatusBadge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/app/admin/_components/ui";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

type Filter = "all" | OrderStatus;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    apiGet<Order[]>("/api/orders")
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: orders?.length ?? 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders ?? []) c[o.status] += 1;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? orders ?? []
        : (orders ?? []).filter((o) => o.status === filter),
    [orders, filter]
  );

  if (error) {
    return (
      <>
        <PageHeader title="سفارش‌ها" />
        <ErrorBlock message={error} />
      </>
    );
  }

  if (!orders) {
    return (
      <>
        <PageHeader title="سفارش‌ها" />
        <LoadingBlock />
      </>
    );
  }

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "همه" },
    ...STATUSES.map((s) => ({ key: s as Filter, label: ORDER_STATUS_LABELS[s] })),
  ];

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        subtitle="مدیریت و پیگیری سفارش‌های ثبت‌شده مشتریان"
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {chips.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? "bg-primary text-primary-content"
                  : "bg-surface border border-border text-content-muted hover:border-border-strong hover:text-content"
              }`}
            >
              {label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                  active ? "bg-primary-hover/60" : "bg-surface-2"
                }`}
              >
                {toPersianNumber(counts[key])}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="سفارشی یافت نشد"
          subtitle={
            filter === "all"
              ? "هنوز هیچ سفارشی ثبت نشده است."
              : "هیچ سفارشی با این وضعیت وجود ندارد."
          }
        />
      ) : (
        <Table
          headers={[
            "کد",
            "مشتری",
            "تلفن",
            "اقلام",
            "مبلغ کل",
            "وضعیت",
            "تاریخ",
            "جزئیات",
          ]}
        >
          {filtered.map((o) => (
            <tr key={o.id} className="hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3 font-bold text-content whitespace-nowrap">
                {o.code}
              </td>
              <td className="px-4 py-3 text-content whitespace-nowrap">
                {o.customer.name}
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                <span dir="ltr">{toPersianNumber(o.customer.phone)}</span>
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {toPersianNumber(
                  o.items.reduce((sum, it) => sum + it.quantity, 0)
                )}{" "}
                قلم
              </td>
              <td className="px-4 py-3 font-bold text-content whitespace-nowrap">
                {formatPersianNumber(o.total)} تومان
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {new Date(o.createdAt).toLocaleDateString("fa-IR")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-soft transition-colors"
                >
                  مشاهده جزئیات
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
