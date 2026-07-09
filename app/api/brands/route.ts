import { brandsRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  try {
    const brands = await brandsRepo.list();
    return Response.json({ ok: true, data: brands });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت فهرست برندها" },
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

  const { name, items, active, logo } = (body ?? {}) as {
    name?: unknown;
    items?: unknown;
    active?: unknown;
    logo?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return Response.json(
      { ok: false, error: "نام برند الزامی است" },
      { status: 400 }
    );
  }

  const itemsNum = Number(items ?? 0);
  if (!Number.isFinite(itemsNum) || itemsNum < 0) {
    return Response.json(
      { ok: false, error: "تعداد کالاهای برند نامعتبر است" },
      { status: 400 }
    );
  }

  const logoStr = typeof logo === "string" ? logo.trim() : "";

  try {
    const brand = await brandsRepo.create({
      name: name.trim(),
      items: itemsNum,
      active: active !== undefined ? Boolean(active) : true,
      logo: logoStr || undefined,
    });
    return Response.json({ ok: true, data: brand });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ایجاد برند" },
      { status: 500 }
    );
  }
}
