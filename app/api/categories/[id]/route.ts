import { categoriesRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { Category } from "@/lib/types";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ ok: false, error: "شناسه دسته‌بندی نامعتبر است" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const patch: Partial<Omit<Category, "id">> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return Response.json({ ok: false, error: "نام دسته‌بندی نامعتبر است" }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.imageKeyword !== undefined) {
    const kw = typeof body.imageKeyword === "string" ? body.imageKeyword.trim() : "";
    if (!kw) {
      return Response.json({ ok: false, error: "کلیدواژه تصویر نامعتبر است" }, { status: 400 });
    }
    patch.imageKeyword = kw;
  }
  if (body.imageLock !== undefined) {
    const n = Number(body.imageLock);
    if (!Number.isFinite(n) || n < 0) {
      return Response.json({ ok: false, error: "شناسه تصویر نامعتبر است" }, { status: 400 });
    }
    patch.imageLock = Math.floor(n);
  }
  if (body.active !== undefined) patch.active = body.active === true;

  try {
    const category = await categoriesRepo.update(id, patch);
    if (!category) {
      return Response.json({ ok: false, error: "دسته‌بندی یافت نشد" }, { status: 404 });
    }
    return Response.json({ ok: true, data: category });
  } catch {
    return Response.json({ ok: false, error: "خطا در ویرایش دسته‌بندی" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ ok: false, error: "شناسه دسته‌بندی نامعتبر است" }, { status: 400 });
  }

  try {
    const removed = await categoriesRepo.remove(id);
    if (!removed) {
      return Response.json({ ok: false, error: "دسته‌بندی یافت نشد" }, { status: 404 });
    }
    return Response.json({ ok: true, data: { id } });
  } catch {
    return Response.json({ ok: false, error: "خطا در حذف دسته‌بندی" }, { status: 500 });
  }
}
