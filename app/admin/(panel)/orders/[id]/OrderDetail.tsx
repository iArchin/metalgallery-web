"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import {
  apiGet,
  apiSend,
  Card,
  PageHeader,
  Table,
  Select,
  Field,
  OrderStatusBadge,
  LoadingBlock,
  ErrorBlock,
  useToast,
} from "@/app/admin/_components/ui";
import Button from "@/app/components/Button";
import { productImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function OrderDetail({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  useEffect(() => {
    apiGet<Order>(`/api/orders/${orderId}`)
      .then((o) => {
        setOrder(o);
        setStatus(o.status);
      })
      .catch((e: Error) => setError(e.message));
  }, [orderId]);

  const saveStatus = async () => {
    setSaving(true);
    try {
      await apiSend<Order>(`/api/orders/${orderId}`, "PUT", { status });
      setOrder((prev) => (prev ? { ...prev, status } : prev));
      show("وضعیت سفارش با موفقیت ذخیره شد");
    } catch (e) {
      show((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const backLink = (
    <Link
      href="/admin/orders"
      className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-content-muted hover:text-primary transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      بازگشت به سفارش‌ها
    </Link>
  );

  if (error) {
    return (
      <>
        <PageHeader title="جزئیات سفارش" actions={backLink} />
        <ErrorBlock message={error} />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader title="جزئیات سفارش" actions={backLink} />
        <LoadingBlock />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`سفارش ${order.code}`}
        subtitle={`ثبت‌شده در ${new Date(order.createdAt).toLocaleDateString("fa-IR")}`}
        actions={backLink}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* customer */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-content">اطلاعات مشتری</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-content-subtle mb-1">نام و نام خانوادگی</dt>
              <dd className="font-bold text-content">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-content-subtle mb-1">شماره تماس</dt>
              <dd className="font-bold text-content">
                <span dir="ltr">{toPersianNumber(order.customer.phone)}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-content-subtle mb-1">آدرس</dt>
              <dd className="text-content leading-6">{order.customer.address}</dd>
            </div>
            {order.customer.note && (
              <div className="sm:col-span-2">
                <dt className="text-content-subtle mb-1">یادداشت مشتری</dt>
                <dd className="text-content leading-6 bg-surface-2 rounded-xl px-3.5 py-2.5">
                  {order.customer.note}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* status control */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">وضعیت سفارش</h2>
          <div className="space-y-4">
            <Field label="وضعیت جدید">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="primary"
              size="sm"
              onClick={saveStatus}
              disabled={saving || status === order.status}
              className="w-full"
            >
              {saving ? "در حال ذخیره…" : "ذخیره وضعیت"}
            </Button>
          </div>
        </Card>
      </div>

      {/* items */}
      <div className="mb-4">
        <Table headers={["محصول", "قیمت واحد", "تعداد", "جمع"]}>
          {order.items.map((it) => (
            <tr key={it.productId} className="hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-surface-2 overflow-hidden">
                    <img
                      src={productImage(it)}
                      alt={it.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-content">{it.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {formatPersianNumber(it.unitPrice)} تومان
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {toPersianNumber(it.quantity)}
              </td>
              <td className="px-4 py-3 font-bold text-content whitespace-nowrap">
                {formatPersianNumber(it.unitPrice * it.quantity)} تومان
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* totals */}
      <Card className="p-5 max-w-md">
        <h2 className="font-extrabold text-content mb-4">صورت‌حساب</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-content-muted">جمع اقلام</dt>
            <dd className="font-bold text-content">
              {formatPersianNumber(order.subtotal)} تومان
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-content-muted">هزینه ارسال</dt>
            <dd className="font-bold text-content">
              {order.shipping === 0 ? (
                <span className="text-mint">رایگان</span>
              ) : (
                <>{formatPersianNumber(order.shipping)} تومان</>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <dt className="font-extrabold text-content">مبلغ قابل پرداخت</dt>
            <dd className="text-base font-extrabold text-primary">
              {formatPersianNumber(order.total)} تومان
            </dd>
          </div>
        </dl>
      </Card>

      {toastNode}
    </>
  );
}
