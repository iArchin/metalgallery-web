import { articlesRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { Article } from "@/lib/types";

function normalizeContent(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return Response.json(
      { ok: false, error: "شناسه مقاله نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const article = await articlesRepo.get(articleId);
    if (!article) {
      return Response.json(
        { ok: false, error: "مقاله یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: article });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت مقاله" },
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
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return Response.json(
      { ok: false, error: "شناسه مقاله نامعتبر است" },
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

  const patch: Partial<Omit<Article, "id">> = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return Response.json(
        { ok: false, error: "عنوان مقاله نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }
    patch.title = title;
  }
  if (body.excerpt !== undefined) patch.excerpt = String(body.excerpt).trim();
  if (body.content !== undefined) {
    const content = normalizeContent(body.content);
    if (content.length === 0) {
      return Response.json(
        { ok: false, error: "متن مقاله نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }
    patch.content = content;
  }
  if (body.date !== undefined) patch.date = String(body.date).trim();
  if (body.author !== undefined) patch.author = String(body.author).trim();
  if (body.category !== undefined) patch.category = String(body.category).trim();
  if (body.readingMinutes !== undefined)
    patch.readingMinutes = Math.max(
      1,
      Math.round(Number(body.readingMinutes) || 1)
    );
  if (body.imageKeyword !== undefined)
    patch.imageKeyword = String(body.imageKeyword).trim();
  if (body.imageLock !== undefined)
    patch.imageLock = Number(body.imageLock) || 0;
  if (body.published !== undefined) patch.published = Boolean(body.published);

  try {
    const article = await articlesRepo.update(articleId, patch);
    if (!article) {
      return Response.json(
        { ok: false, error: "مقاله یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: article });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ویرایش مقاله" },
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
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return Response.json(
      { ok: false, error: "شناسه مقاله نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const removed = await articlesRepo.remove(articleId);
    if (!removed) {
      return Response.json(
        { ok: false, error: "مقاله یافت نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: { id: articleId } });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در حذف مقاله" },
      { status: 500 }
    );
  }
}
