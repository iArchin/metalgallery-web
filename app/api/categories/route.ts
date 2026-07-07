import { categoriesRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  try {
    const categories = await categoriesRepo.list();
    return Response.json({ ok: true, data: categories });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت دسته‌بندی‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const imageKeyword = typeof body.imageKeyword === "string" ? body.imageKeyword.trim() : "";
  const imageLock = Number(body.imageLock);

  if (!name) {
    return Response.json({ ok: false, error: "نام دسته‌بندی الزامی است" }, { status: 400 });
  }
  if (!imageKeyword) {
    return Response.json({ ok: false, error: "کلیدواژه تصویر الزامی است" }, { status: 400 });
  }
  if (!Number.isFinite(imageLock)) {
    return Response.json({ ok: false, error: "شناسه تصویر نامعتبر است" }, { status: 400 });
  }

  try {
    const category = await categoriesRepo.create({
      name,
      imageKeyword,
      imageLock: Math.floor(imageLock),
      active: body.active === undefined ? true : body.active === true,
    });
    return Response.json({ ok: true, data: category });
  } catch {
    return Response.json({ ok: false, error: "خطا در ایجاد دسته‌بندی" }, { status: 500 });
  }
}
