import { getSettings, updateSettings } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  try {
    const data = await getSettings();
    return Response.json({ ok: true, data });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت تنظیمات سایت" },
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

  const patch = { ...body } as Partial<SiteSettings> & Record<string, unknown>;

  // Coerce numeric fields; reject values that are not valid numbers.
  const invalid = (label: string) =>
    Response.json(
      { ok: false, error: `مقدار «${label}» باید عدد معتبر باشد` },
      { status: 400 }
    );

  if (patch.freeShippingThreshold !== undefined) {
    const n = Number(patch.freeShippingThreshold);
    if (!Number.isFinite(n) || n < 0) return invalid("حداقل خرید برای ارسال رایگان");
    patch.freeShippingThreshold = n;
  }
  if (patch.shippingCost !== undefined) {
    const n = Number(patch.shippingCost);
    if (!Number.isFinite(n) || n < 0) return invalid("هزینه ارسال");
    patch.shippingCost = n;
  }
  if (patch.saleCampaign !== undefined) {
    if (
      !patch.saleCampaign ||
      typeof patch.saleCampaign !== "object" ||
      Array.isArray(patch.saleCampaign)
    ) {
      return Response.json(
        { ok: false, error: "اطلاعات کمپین فروش نامعتبر است" },
        { status: 400 }
      );
    }
    const sale = { ...patch.saleCampaign } as Partial<SiteSettings["saleCampaign"]> &
      Record<string, unknown>;
    if (sale.percent !== undefined) {
      const n = Number(sale.percent);
      if (!Number.isFinite(n) || n < 0) return invalid("درصد تخفیف کمپین");
      sale.percent = n;
    }
    if (sale.pillPercent !== undefined) {
      const n = Number(sale.pillPercent);
      if (!Number.isFinite(n) || n < 0) return invalid("درصد نشان کمپین");
      sale.pillPercent = n;
    }
    if (sale.enabled !== undefined) sale.enabled = Boolean(sale.enabled);
    patch.saleCampaign = sale as SiteSettings["saleCampaign"];
  }
  if (patch.heroSlides !== undefined) {
    if (!Array.isArray(patch.heroSlides)) {
      return Response.json(
        { ok: false, error: "اطلاعات اسلایدهای بنر نامعتبر است" },
        { status: 400 }
      );
    }
    const str = (v: unknown) =>
      typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
    // Sanitize every slide and reassign sequential ids so keys stay unique.
    patch.heroSlides = patch.heroSlides.map((raw, i): SiteSettings["heroSlides"][number] => {
      const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      return {
        id: i + 1,
        badgeText: str(s.badgeText),
        title: str(s.title),
        subtitle: str(s.subtitle),
        ctaText: str(s.ctaText),
        ctaHref: str(s.ctaHref) || "/products",
        image: str(s.image),
        active: s.active === undefined ? true : Boolean(s.active),
      };
    });
  }

  try {
    const data = await updateSettings(patch as Partial<SiteSettings>);
    return Response.json({ ok: true, data });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ذخیره تنظیمات سایت" },
      { status: 500 }
    );
  }
}
