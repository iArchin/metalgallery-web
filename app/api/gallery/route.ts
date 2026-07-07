import { galleryRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  try {
    const items = await galleryRepo.list();
    return Response.json({ ok: true, data: items });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت گالری" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

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

  if (typeof caption !== "string" || !caption.trim()) {
    return Response.json(
      { ok: false, error: "عنوان تصویر الزامی است" },
      { status: 400 }
    );
  }
  if (typeof imageKeyword !== "string" || !imageKeyword.trim()) {
    return Response.json(
      { ok: false, error: "کلیدواژه تصویر الزامی است" },
      { status: 400 }
    );
  }

  const lockNum = Number(imageLock ?? 0);
  if (!Number.isFinite(lockNum) || lockNum < 0) {
    return Response.json(
      { ok: false, error: "شناسه تصویر نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const item = await galleryRepo.create({
      caption: caption.trim(),
      imageKeyword: imageKeyword.trim(),
      imageLock: lockNum,
      active: active !== undefined ? Boolean(active) : true,
    });
    return Response.json({ ok: true, data: item });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در افزودن تصویر به گالری" },
      { status: 500 }
    );
  }
}
