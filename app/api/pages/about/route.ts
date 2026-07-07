import { getAboutContent, updateAboutContent } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { AboutContent } from "@/lib/types";

export async function GET() {
  try {
    const data = await getAboutContent();
    return Response.json({ ok: true, data });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت محتوای صفحه درباره ما" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const patch = { ...body } as Partial<AboutContent> & Record<string, unknown>;

  // Arrays (storyParagraphs, stats, values) are passed through as-is,
  // but if present they must actually be arrays.
  if (patch.storyParagraphs !== undefined && !Array.isArray(patch.storyParagraphs)) {
    return Response.json(
      { ok: false, error: "پاراگراف‌های داستان باید به صورت آرایه ارسال شوند" },
      { status: 400 }
    );
  }
  if (patch.stats !== undefined && !Array.isArray(patch.stats)) {
    return Response.json(
      { ok: false, error: "آمار صفحه باید به صورت آرایه ارسال شود" },
      { status: 400 }
    );
  }
  if (patch.values !== undefined && !Array.isArray(patch.values)) {
    return Response.json(
      { ok: false, error: "ارزش‌های ما باید به صورت آرایه ارسال شوند" },
      { status: 400 }
    );
  }
  if (patch.storyImageLock !== undefined) {
    const n = Number(patch.storyImageLock);
    if (!Number.isFinite(n)) {
      return Response.json(
        { ok: false, error: "شناسه تصویر داستان باید عدد معتبر باشد" },
        { status: 400 }
      );
    }
    patch.storyImageLock = n;
  }

  try {
    const data = await updateAboutContent(patch as Partial<AboutContent>);
    return Response.json({ ok: true, data });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ذخیره محتوای صفحه درباره ما" },
      { status: 500 }
    );
  }
}
