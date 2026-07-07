import { listOrders, placeOrder } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const orders = await listOrders();
    return Response.json({ ok: true, data: orders });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت سفارش‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { items, customer } = (body ?? {}) as {
    items?: unknown;
    customer?: unknown;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json(
      { ok: false, error: "سبد خرید خالی است" },
      { status: 400 }
    );
  }

  const parsedItems: { productId: number; quantity: number }[] = [];
  for (const raw of items) {
    const item = (raw ?? {}) as { productId?: unknown; quantity?: unknown };
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return Response.json(
        { ok: false, error: "اقلام سفارش نامعتبر است" },
        { status: 400 }
      );
    }
    parsedItems.push({ productId, quantity });
  }

  const c = (customer ?? {}) as {
    name?: unknown;
    phone?: unknown;
    address?: unknown;
    note?: unknown;
  };

  if (
    typeof c.name !== "string" ||
    typeof c.phone !== "string" ||
    typeof c.address !== "string" ||
    !c.name.trim() ||
    !c.phone.trim() ||
    !c.address.trim()
  ) {
    return Response.json(
      { ok: false, error: "نام، تلفن و آدرس الزامی است" },
      { status: 400 }
    );
  }

  try {
    const { order, error } = await placeOrder({
      items: parsedItems,
      customer: {
        name: c.name,
        phone: c.phone,
        address: c.address,
        note: typeof c.note === "string" && c.note.trim() ? c.note : undefined,
      },
    });

    if (error || !order) {
      return Response.json(
        { ok: false, error: error ?? "ثبت سفارش ناموفق بود" },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, data: order });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ثبت سفارش" },
      { status: 500 }
    );
  }
}
