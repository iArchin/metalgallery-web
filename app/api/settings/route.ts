import { getSettings, updateSettings } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import { PHONE_KINDS, type PhoneKind, type SiteSettings } from "@/lib/types";

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
    /**
     * A slide button may point at an internal path or an http(s) address.
     * Anything else — notably `javascript:` and `data:` — is replaced rather
     * than stored: the value is rendered straight into an anchor's href, and
     * the panel is not the right place to trust.
     */
    const href = (v: unknown) => {
      const h = str(v);
      if (h.startsWith("/") && !h.startsWith("//")) return h;
      if (/^https?:\/\//i.test(h)) return h;
      return "/products";
    };
    // Sanitize every slide and reassign sequential ids so keys stay unique.
    patch.heroSlides = patch.heroSlides.map((raw, i): SiteSettings["heroSlides"][number] => {
      const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      return {
        id: i + 1,
        badgeText: str(s.badgeText),
        title: str(s.title),
        subtitle: str(s.subtitle),
        ctaText: str(s.ctaText),
        ctaHref: href(s.ctaHref),
        image: str(s.image),
        active: s.active === undefined ? true : Boolean(s.active),
      };
    });
  }

  // Contact lists. Same shape of sanitiser as heroSlides: ids are reassigned
  // sequentially so React keys stay unique, empty rows are dropped, and `kind`
  // is clamped to the union — an unknown kind would reach the icon lookup as
  // undefined and render an empty box.
  const text = (v: unknown) =>
    typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

  if (patch.phones !== undefined) {
    if (!Array.isArray(patch.phones)) {
      return Response.json(
        { ok: false, error: "اطلاعات شماره‌های تماس نامعتبر است" },
        { status: 400 }
      );
    }
    patch.phones = patch.phones
      .map((raw) => (raw && typeof raw === "object" ? (raw as unknown as Record<string, unknown>) : {}))
      .map((p) => ({
        id: 0,
        label: text(p.label),
        value: text(p.value),
        kind: (PHONE_KINDS as readonly string[]).includes(text(p.kind))
          ? (text(p.kind) as PhoneKind)
          : ("landline" as PhoneKind),
      }))
      .filter((p) => p.value)
      .map((p, i) => ({ ...p, id: i + 1 }));

    // Keep the legacy scalar pointing at the first entry, the way a product's
    // `image` mirrors `images[0]`. Every older reader of settings.phone — the
    // navbar, the chat widget, JSON-LD — keeps working untouched. Mirroring an
    // EMPTY list to an empty string matters as much: sitePhones() falls back to
    // the scalar, so leaving it behind would resurrect a number the admin just
    // deleted.
    patch.phone = patch.phones[0]?.value ?? "";
  }

  if (patch.addresses !== undefined) {
    if (!Array.isArray(patch.addresses)) {
      return Response.json(
        { ok: false, error: "اطلاعات آدرس‌ها نامعتبر است" },
        { status: 400 }
      );
    }
    patch.addresses = patch.addresses
      .map((raw) => (raw && typeof raw === "object" ? (raw as unknown as Record<string, unknown>) : {}))
      .map((a) => ({ id: 0, label: text(a.label), value: text(a.value) }))
      .filter((a) => a.value)
      .map((a, i) => ({ ...a, id: i + 1 }));

    patch.address = patch.addresses[0]?.value ?? "";
  }

  // Saved model scales, e.g. ["1:6", "1:12", "1:18"]. De-duplicated and capped:
  // this is a picker's option list, not a data store.
  if (patch.scales !== undefined) {
    if (!Array.isArray(patch.scales)) {
      return Response.json({ ok: false, error: "فهرست مقیاس‌ها نامعتبر است" }, { status: 400 });
    }
    const seen = new Set<string>();
    patch.scales = (patch.scales as unknown[])
      .map((v) => (typeof v === "string" ? v.trim().slice(0, 40) : ""))
      .filter((v) => {
        if (!v || seen.has(v)) return false;
        seen.add(v);
        return true;
      })
      .slice(0, 60);
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
