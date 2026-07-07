import type { Brand } from "@/lib/types";
import { brandsRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId)) {
    return Response.json(
      { ok: false, error: "شناسه برند نامعتبر است" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { name, items, active } = (body ?? {}) as {
    name?: unknown;
    items?: unknown;
    active?: unknown;
  };

  const patch: Partial<Omit<Brand, "id">> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return Response.json(
        { ok: false, error: "نام برند الزامی است" },
        { status: 400 }
      );
    }
    patch.name = name.trim();
  }

  if (items !== undefined) {
    const itemsNum = Number(items);
    if (!Number.isFinite(itemsNum) || itemsNum < 0) {
      return Response.json(
        { ok: false, error: "تعداد کالاهای برند نامعتبر است" },
        { status: 400 }
      );
    }
    patch.items = itemsNum;
  }

  if (active !== undefined) patch.active = Boolean(active);

  try {
    const brand = await brandsRepo.update(brandId, patch);
    if (!brand) {
      return Response.json(
        { ok: false, error: "برند مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: brand });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در به‌روزرسانی برند" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId)) {
    return Response.json(
      { ok: false, error: "شناسه برند نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const removed = await brandsRepo.remove(brandId);
    if (!removed) {
      return Response.json(
        { ok: false, error: "برند مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: { id: brandId } });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در حذف برند" },
      { status: 500 }
    );
  }
}
