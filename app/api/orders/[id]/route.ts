import { getOrder, updateOrderStatus } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return Response.json(
      { ok: false, error: "شناسه سفارش نامعتبر است" },
      { status: 400 }
    );
  }

  const order = await getOrder(orderId);
  if (!order) {
    return Response.json(
      { ok: false, error: "سفارش یافت نشد" },
      { status: 404 }
    );
  }

  return Response.json({ ok: true, data: order });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return Response.json(
      { ok: false, error: "شناسه سفارش نامعتبر است" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { status } = (body ?? {}) as { status?: unknown };

  if (
    typeof status !== "string" ||
    !VALID_STATUSES.includes(status as OrderStatus)
  ) {
    return Response.json(
      { ok: false, error: "وضعیت سفارش نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateOrderStatus(orderId, status as OrderStatus);
    if (!updated) {
      return Response.json(
        { ok: false, error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: updated });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در به‌روزرسانی سفارش" },
      { status: 500 }
    );
  }
}
