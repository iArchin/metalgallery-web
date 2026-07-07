import type { GalleryItem } from "@/lib/types";
import { galleryRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) {
    return Response.json(
      { ok: false, error: "شناسه تصویر نامعتبر است" },
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

  const { caption, imageKeyword, imageLock, active } = (body ?? {}) as {
    caption?: unknown;
    imageKeyword?: unknown;
    imageLock?: unknown;
    active?: unknown;
  };

  const patch: Partial<Omit<GalleryItem, "id">> = {};

  if (caption !== undefined) {
    if (typeof caption !== "string" || !caption.trim()) {
      return Response.json(
        { ok: false, error: "عنوان تصویر الزامی است" },
        { status: 400 }
      );
    }
    patch.caption = caption.trim();
  }

  if (imageKeyword !== undefined) {
    if (typeof imageKeyword !== "string" || !imageKeyword.trim()) {
      return Response.json(
        { ok: false, error: "کلیدواژه تصویر الزامی است" },
        { status: 400 }
      );
    }
    patch.imageKeyword = imageKeyword.trim();
  }

  if (imageLock !== undefined) {
    const lockNum = Number(imageLock);
    if (!Number.isFinite(lockNum) || lockNum < 0) {
      return Response.json(
        { ok: false, error: "شناسه تصویر گالری نامعتبر است" },
        { status: 400 }
      );
    }
    patch.imageLock = lockNum;
  }

  if (active !== undefined) patch.active = Boolean(active);

  try {
    const item = await galleryRepo.update(itemId, patch);
    if (!item) {
      return Response.json(
        { ok: false, error: "تصویر مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: item });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در به‌روزرسانی گالری" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) {
    return Response.json(
      { ok: false, error: "شناسه تصویر نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const removed = await galleryRepo.remove(itemId);
    if (!removed) {
      return Response.json(
        { ok: false, error: "تصویر مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: { id: itemId } });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در حذف تصویر" },
      { status: 500 }
    );
  }
}
