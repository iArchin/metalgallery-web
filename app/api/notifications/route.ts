import { getCurrentCustomer } from "@/lib/server/auth";
import { listOrdersByPhone } from "@/lib/server/repos";
import type { Order } from "@/lib/types";

function statusText(o: Order): string {
  switch (o.status) {
    case "pending":
      return `سفارش ${o.code} ثبت شد و در انتظار بررسی است`;
    case "processing":
      return `سفارش ${o.code} در حال آماده‌سازی است`;
    case "shipped":
      return `سفارش ${o.code} ارسال شد`;
    case "delivered":
      return `سفارش ${o.code} با موفقیت تحویل داده شد`;
    case "cancelled":
      return `سفارش ${o.code} لغو شد`;
  }
}

/** Customer-facing notifications, derived from the customer's own orders. */
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return Response.json({ ok: true, data: { items: [], unread: 0, authed: false } });
  }
  const orders = await listOrdersByPhone(customer.phone);
  const items = orders.slice(0, 10).map((o) => ({
    id: o.id,
    text: statusText(o),
    at: o.updatedAt,
    status: o.status,
  }));
  // "unread" = orders still in progress (something the customer is waiting on).
  const unread = orders.filter(
    (o) => o.status === "pending" || o.status === "processing" || o.status === "shipped"
  ).length;
  return Response.json({ ok: true, data: { items, unread, authed: true } });
}
