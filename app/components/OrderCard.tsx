import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-primary-soft text-primary",
  processing: "bg-primary-soft text-primary",
  shipped: "bg-surface-3 text-content-muted",
  delivered: "bg-mint-soft text-mint",
  cancelled: "bg-primary text-primary-content",
};

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/** One order — summary row, optionally expanded with its line items. */
export default function OrderCard({
  order,
  detailed = false,
}: {
  order: Order;
  detailed?: boolean;
}) {
  const itemCount = order.items.reduce((s, l) => s + l.quantity, 0);
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-content" dir="ltr">
              {order.code}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_TONE[order.status]}`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="mt-1 text-xs text-content-muted">
            {faDate(order.createdAt)} · {toPersianNumber(itemCount)} کالا
          </div>
        </div>
        <div className="text-sm font-bold text-content">
          {formatPersianNumber(order.total)} تومان
        </div>
      </div>

      {detailed && (
        <ul className="mt-3 pt-3 border-t border-border space-y-1.5">
          {order.items.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs text-content-muted">
              <span className="truncate">
                {l.name} × {toPersianNumber(l.quantity)}
              </span>
              <span dir="ltr" className="shrink-0">
                {formatPersianNumber(l.unitPrice * l.quantity)}
              </span>
            </li>
          ))}
          {order.shipping > 0 && (
            <li className="flex items-center justify-between gap-2 text-xs text-content-muted">
              <span>هزینه ارسال</span>
              <span dir="ltr" className="shrink-0">
                {formatPersianNumber(order.shipping)}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
