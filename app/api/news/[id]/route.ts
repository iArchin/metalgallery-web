import { newsRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { NewsItem } from "@/lib/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return Response.json(
      { ok: false, error: "شناسه خبر نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const item = await newsRepo.get(newsId);
    if (!item) {
      return Response.json(
        { ok: false, error: "خبر یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: item });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت خبر" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return Response.json(
      { ok: false, error: "شناسه خبر نامعتبر است" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const patch: Partial<Omit<NewsItem, "id">> = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return Response.json(
        { ok: false, error: "عنوان خبر نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }
    patch.title = title;
  }
  if (body.body !== undefined) {
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return Response.json(
        { ok: false, error: "متن خبر نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }
    patch.body = text;
  }
  if (body.date !== undefined) patch.date = String(body.date).trim();
  if (body.tag !== undefined) patch.tag = String(body.tag).trim();
  if (body.published !== undefined) patch.published = Boolean(body.published);

  try {
    const item = await newsRepo.update(newsId, patch);
    if (!item) {
      return Response.json(
        { ok: false, error: "خبر یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: item });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ویرایش خبر" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const newsId = Number(id);
  if (!Number.isInteger(newsId)) {
    return Response.json(
      { ok: false, error: "شناسه خبر نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const removed = await newsRepo.remove(newsId);
    if (!removed) {
      return Response.json(
        { ok: false, error: "خبر یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: { id: newsId } });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در حذف خبر" },
      { status: 500 }
    );
  }
}
