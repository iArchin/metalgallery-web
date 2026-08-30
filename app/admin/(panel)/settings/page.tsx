"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  PHONE_KINDS,
  PHONE_KIND_LABELS,
  guessPhoneKind,
  type PhoneKind,
  type SiteAddress,
  type SitePhone,
  type SiteSettings,
} from "@/lib/types";
import ContactIcon from "@/app/components/ContactIcon";
import Button from "@/app/components/Button";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  apiUpload,
  PageHeader,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
  ConfirmButton,
  LoadingBlock,
  ErrorBlock,
  Spinner,
  useToast,
} from "@/app/admin/_components/ui";

/** Ready-made banners shipped with the site. An admin can also upload their own,
 *  so this is a shortcut list, not the set of allowed images. */
const HERO_IMAGES = [
  "/images/toy-hero.jpg",
  "/images/toy-banner.jpg",
  "/images/toy-promo.jpg",
  "/images/toy-kids-1.jpg",
  "/images/toy-kids-2.jpg",
  "/images/toy-kids-3.jpg",
  "/images/toy-kids-4.jpg",
  "/images/toy-kids-5.jpg",
] as const;

interface HeroSlideForm {
  id: number;
  badgeText: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  active: boolean;
}

/**
 * A miniature of how the slide actually renders on the home page — the same
 * image fit, gradient and conditional badge/subtitle/button as HeroCarousel.
 *
 * This is what makes the CURRENT image visible: the swatch grid below can only
 * highlight one of the ready-made banners, so an uploaded (or hand-typed) image
 * used to leave the editor showing nothing selected and no way to tell what the
 * slide would look like.
 */
/** Reorder arrows shared by the phone and address repeaters. */
function RowMoveButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  const cls =
    "rounded-lg p-1.5 text-content-muted hover:text-primary hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors";
  return (
    <>
      <button type="button" onClick={onUp} disabled={disableUp} aria-label="انتقال به بالا" className={cls}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button type="button" onClick={onDown} disabled={disableDown} aria-label="انتقال به پایین" className={cls}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </>
  );
}

function SlidePreview({ slide }: { slide: HeroSlideForm }) {
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-border bg-surface-2">
      {slide.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-content-subtle">
          هنوز تصویری انتخاب نشده است
        </div>
      )}
      <div
        className="absolute inset-0 bg-linear-to-l from-black/75 via-black/45 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 flex h-full max-w-[75%] flex-col justify-center gap-1.5 p-4 sm:p-6 text-white">
        {/* Mirrors HeroCarousel exactly: badge and subtitle are digit-converted,
            title and button label are not, and each is hidden when empty. */}
        {slide.badgeText && (
          <span className="inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-content">
            {toPersianNumber(slide.badgeText)}
          </span>
        )}
        <p className="text-base sm:text-xl font-extrabold leading-snug line-clamp-2">
          {slide.title || (
            <span className="text-white/50">عنوان اسلاید</span>
          )}
        </p>
        {slide.subtitle && (
          <p className="text-[11px] sm:text-sm font-semibold leading-relaxed text-white/85 line-clamp-2">
            {toPersianNumber(slide.subtitle)}
          </p>
        )}
        {slide.ctaText && (
          <span className="mt-1 inline-flex w-fit items-center rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold text-content">
            {slide.ctaText}
          </span>
        )}
      </div>
      {!slide.active && (
        <span className="absolute top-2 left-2 z-20 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
          غیرفعال — در سایت نمایش داده نمی‌شود
        </span>
      )}
    </div>
  );
}

interface SettingsForm {
  siteName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  hero: {
    badgeText: string;
    title: string;
    ctaText: string;
    sideTitle: string;
    sideText: string;
    sideCtaText: string;
  };
  heroSlides: HeroSlideForm[];
  phones: SitePhone[];
  addresses: SiteAddress[];
  saleEnabled: boolean;
  salePercent: string;
  saleTitle: string;
  salePillPercent: string;
  saleCtaText: string;
  freeShippingThreshold: string;
  shippingCost: string;
  footerAbout: string;
  socials: { facebook: string; twitter: string; linkedin: string; instagram: string };
}

function toForm(s: SiteSettings): SettingsForm {
  return {
    siteName: s.siteName,
    tagline: s.tagline,
    phone: s.phone,
    email: s.email,
    address: s.address,
    workingHours: s.workingHours,
    hero: { ...s.hero },
    heroSlides: (s.heroSlides ?? []).map((sl) => ({ ...sl })),
    // Settings saved before these lists existed have only the scalars — seed
    // the editor from them so the first save does not wipe the old number.
    phones:
      s.phones && s.phones.length > 0
        ? s.phones.map((p) => ({ ...p }))
        : s.phone?.trim()
          ? [{ id: 1, label: "", value: s.phone, kind: guessPhoneKind(s.phone) }]
          : [],
    addresses:
      s.addresses && s.addresses.length > 0
        ? s.addresses.map((a) => ({ ...a }))
        : s.address?.trim()
          ? [{ id: 1, label: "", value: s.address }]
          : [],
    saleEnabled: s.saleCampaign.enabled,
    salePercent: String(s.saleCampaign.percent),
    saleTitle: s.saleCampaign.title,
    salePillPercent: String(s.saleCampaign.pillPercent),
    saleCtaText: s.saleCampaign.ctaText,
    freeShippingThreshold: String(s.freeShippingThreshold),
    shippingCost: String(s.shippingCost),
    footerAbout: s.footerAbout,
    socials: { ...s.socials },
  };
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  useEffect(() => {
    apiGet<SiteSettings>("/api/settings")
      .then((data) => setForm(toForm(data)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات")
      )
      .finally(() => setLoading(false));
  }, []);

  function patch(p: Partial<SettingsForm>) {
    setForm((f) => (f ? { ...f, ...p } : f));
  }

  function patchHero(p: Partial<SettingsForm["hero"]>) {
    setForm((f) => (f ? { ...f, hero: { ...f.hero, ...p } } : f));
  }

  function patchSocials(p: Partial<SettingsForm["socials"]>) {
    setForm((f) => (f ? { ...f, socials: { ...f.socials, ...p } } : f));
  }

  /* ------------------------------------------------------- hero slides */

  function patchSlide(id: number, p: Partial<HeroSlideForm>) {
    setForm((f) =>
      f
        ? { ...f, heroSlides: f.heroSlides.map((s) => (s.id === id ? { ...s, ...p } : s)) }
        : f
    );
  }

  function addSlide() {
    setForm((f) => {
      if (!f) return f;
      const nextId = f.heroSlides.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      const slide: HeroSlideForm = {
        id: nextId,
        badgeText: "",
        title: "",
        subtitle: "",
        ctaText: "مشاهده محصولات",
        ctaHref: "/products",
        image: HERO_IMAGES[0],
        active: true,
      };
      return { ...f, heroSlides: [...f.heroSlides, slide] };
    });
  }

  function removeSlide(id: number) {
    setForm((f) => (f ? { ...f, heroSlides: f.heroSlides.filter((s) => s.id !== id) } : f));
  }

  /* ------------------------------------------------- phones & addresses */

  const nextId = (rows: { id: number }[]) =>
    rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  function patchPhone(id: number, p: Partial<SitePhone>) {
    setForm((f) =>
      f ? { ...f, phones: f.phones.map((x) => (x.id === id ? { ...x, ...p } : x)) } : f
    );
  }
  function addPhone() {
    setForm((f) =>
      f
        ? {
            ...f,
            phones: [
              ...f.phones,
              { id: nextId(f.phones), label: "", value: "", kind: "landline" as PhoneKind },
            ],
          }
        : f
    );
  }
  function removePhone(id: number) {
    setForm((f) => (f ? { ...f, phones: f.phones.filter((x) => x.id !== id) } : f));
  }
  function movePhone(id: number, dir: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const arr = [...f.phones];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, phones: arr };
    });
  }

  function patchAddress(id: number, p: Partial<SiteAddress>) {
    setForm((f) =>
      f ? { ...f, addresses: f.addresses.map((x) => (x.id === id ? { ...x, ...p } : x)) } : f
    );
  }
  function addAddress() {
    setForm((f) =>
      f
        ? { ...f, addresses: [...f.addresses, { id: nextId(f.addresses), label: "", value: "" }] }
        : f
    );
  }
  function removeAddress(id: number) {
    setForm((f) => (f ? { ...f, addresses: f.addresses.filter((x) => x.id !== id) } : f));
  }
  function moveAddress(id: number, dir: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const arr = [...f.addresses];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, addresses: arr };
    });
  }

  /* --------------------------------------------- slide image uploads */

  // One hidden input serves every slide; `uploadForSlide` remembers which row
  // opened the picker so the result lands on the right slide.
  const slideFileRef = useRef<HTMLInputElement>(null);
  const [uploadForSlide, setUploadForSlide] = useState<number | null>(null);
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);

  function pickSlideImage(id: number) {
    setUploadForSlide(id);
    slideFileRef.current?.click();
  }

  async function handleSlideFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // allow re-picking the same file after a failed upload
    const id = uploadForSlide;
    setUploadForSlide(null);
    if (!file || id === null) return;

    const fd = new FormData();
    fd.append("files", file); // the field name /api/admin/uploads expects
    setUploadingSlide(id);
    try {
      const urls = await apiUpload<string[]>("/api/admin/uploads", fd);
      if (urls[0]) patchSlide(id, { image: urls[0] });
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در بارگذاری تصویر", "error");
    } finally {
      setUploadingSlide(null);
    }
  }

  function moveSlide(id: number, dir: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const arr = [...f.heroSlides];
      const idx = arr.findIndex((s) => s.id === id);
      const j = idx + dir;
      if (idx === -1 || j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...f, heroSlides: arr };
    });
  }

  async function handleSave() {
    if (!form) return;
    if (!form.siteName.trim()) {
      show("نام فروشگاه الزامی است", "error");
      return;
    }
    const badSlide = form.heroSlides.findIndex((s) => !s.title.trim() || !s.image);
    if (badSlide !== -1) {
      show(`اسلاید ${badSlide + 1}: عنوان و تصویر الزامی است`, "error");
      return;
    }
    setSaving(true);
    try {
      const body: SiteSettings = {
        siteName: form.siteName.trim(),
        tagline: form.tagline.trim(),
        // The scalars stay in the payload as the primary of each list, so every
        // older reader of settings.phone / .address keeps working. The API
        // re-derives them from the lists, so these are a hint, not the truth.
        phone: (form.phones[0]?.value ?? "").trim(),
        email: form.email.trim(),
        address: (form.addresses[0]?.value ?? "").trim(),
        workingHours: form.workingHours.trim(),
        phones: form.phones
          .map((p, i) => ({ ...p, id: i + 1, label: p.label.trim(), value: p.value.trim() }))
          .filter((p) => p.value),
        addresses: form.addresses
          .map((a, i) => ({ ...a, id: i + 1, label: a.label.trim(), value: a.value.trim() }))
          .filter((a) => a.value),
        hero: {
          badgeText: form.hero.badgeText.trim(),
          title: form.hero.title.trim(),
          ctaText: form.hero.ctaText.trim(),
          sideTitle: form.hero.sideTitle.trim(),
          sideText: form.hero.sideText.trim(),
          sideCtaText: form.hero.sideCtaText.trim(),
        },
        heroSlides: form.heroSlides.map((s, i) => ({
          id: i + 1,
          badgeText: s.badgeText.trim(),
          title: s.title.trim(),
          subtitle: s.subtitle.trim(),
          ctaText: s.ctaText.trim(),
          ctaHref: s.ctaHref.trim() || "/products",
          image: s.image,
          active: s.active,
        })),
        saleCampaign: {
          enabled: form.saleEnabled,
          percent: Number(form.salePercent) || 0,
          title: form.saleTitle.trim(),
          pillPercent: Number(form.salePillPercent) || 0,
          ctaText: form.saleCtaText.trim(),
        },
        footerAbout: form.footerAbout.trim(),
        socials: {
          facebook: form.socials.facebook.trim(),
          twitter: form.socials.twitter.trim(),
          linkedin: form.socials.linkedin.trim(),
          instagram: form.socials.instagram.trim(),
        },
        freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
        shippingCost: Number(form.shippingCost) || 0,
      };
      const data = await apiSend<SiteSettings>("/api/settings", "PUT", body);
      setForm(toForm(data));
      // A storefront tab that is already open keeps its rendered header and
      // footer until the page is reloaded — that is how the App Router reuses
      // a layout, not a cache. Say so, so a refresh does not feel like magic.
      show("تنظیمات سایت ذخیره شد — برای دیدن تغییرات، صفحه سایت را یک بار رفرش کنید");
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="تنظیمات سایت" subtitle="مدیریت تنظیمات عمومی فروشگاه" />
        <LoadingBlock />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div>
        <PageHeader title="تنظیمات سایت" subtitle="مدیریت تنظیمات عمومی فروشگاه" />
        <ErrorBlock message={error ?? "خطا در دریافت اطلاعات"} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="تنظیمات سایت"
        subtitle="اطلاعات تماس، بنرها، کمپین تخفیف و تنظیمات ارسال"
      />

      <div className="space-y-5">
        {/* --------------------------------------------------- اطلاعات تماس */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">اطلاعات تماس</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نام فروشگاه">
              <Input
                value={form.siteName}
                onChange={(e) => patch({ siteName: e.target.value })}
              />
            </Field>
            <Field label="شعار (تگ‌لاین)">
              <Input
                value={form.tagline}
                onChange={(e) => patch({ tagline: e.target.value })}
              />
            </Field>
            <Field label="ایمیل">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                dir="ltr"
              />
            </Field>
            <Field label="ساعات کاری">
              <Input
                value={form.workingHours}
                onChange={(e) => patch({ workingHours: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        {/* -------------------------------------------- شماره‌های تماس */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-content">شماره‌های تماس</h2>
              <p className="text-sm text-content-muted mt-1">
                هر تعداد شماره که بخواهید. نوع هر شماره آیکون آن را در سایت تعیین
                می‌کند؛ شماره اول، شماره اصلی فروشگاه است.
              </p>
            </div>
            <button
              type="button"
              onClick={addPhone}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
            >
              + افزودن شماره
            </button>
          </div>

          {form.phones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-content-muted">
              هنوز شماره‌ای ثبت نشده است. با دکمه «افزودن شماره» شروع کنید.
            </div>
          ) : (
            <div className="space-y-3">
              {form.phones.map((ph, i) => (
                <div
                  key={ph.id}
                  className="rounded-2xl border border-border bg-surface-2/50 p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="mb-2.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <ContactIcon name={ph.kind} />
                    </span>
                    <div className="min-w-40 flex-1">
                      <Field label="شماره">
                        <Input
                          value={ph.value}
                          onChange={(e) => patchPhone(ph.id, { value: e.target.value })}
                          dir="ltr"
                          placeholder="۰۲۱-۵۵۵۰۱۱۲"
                        />
                      </Field>
                    </div>
                    <div className="min-w-36 flex-1">
                      <Field label="نوع">
                        <Select
                          value={ph.kind}
                          onChange={(e) =>
                            patchPhone(ph.id, { kind: e.target.value as PhoneKind })
                          }
                        >
                          {PHONE_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {PHONE_KIND_LABELS[k]}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="min-w-36 flex-1">
                      <Field label="برچسب (اختیاری)">
                        <Input
                          value={ph.label}
                          onChange={(e) => patchPhone(ph.id, { label: e.target.value })}
                          placeholder="مثلاً دفتر مرکزی"
                        />
                      </Field>
                    </div>
                    <div className="mb-2 flex items-center gap-1">
                      <RowMoveButtons
                        onUp={() => movePhone(ph.id, -1)}
                        onDown={() => movePhone(ph.id, 1)}
                        disableUp={i === 0}
                        disableDown={i === form.phones.length - 1}
                      />
                      <ConfirmButton onConfirm={() => removePhone(ph.id)} />
                    </div>
                  </div>
                  {i === 0 && (
                    <p className="mt-2 text-xs text-content-subtle">
                      این شماره در نوار بالای سایت و در پشتیبانی نمایش داده می‌شود.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ---------------------------------------------------- آدرس‌ها */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-content">آدرس‌ها</h2>
              <p className="text-sm text-content-muted mt-1">
                اگر بیش از یک شعبه دارید، همه را اینجا اضافه کنید. آدرس اول،
                آدرس اصلی است.
              </p>
            </div>
            <button
              type="button"
              onClick={addAddress}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
            >
              + افزودن آدرس
            </button>
          </div>

          {form.addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-content-muted">
              هنوز آدرسی ثبت نشده است. با دکمه «افزودن آدرس» شروع کنید.
            </div>
          ) : (
            <div className="space-y-3">
              {form.addresses.map((ad, i) => (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-border bg-surface-2/50 p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="mb-2.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <ContactIcon name="address" />
                    </span>
                    <div className="min-w-36 sm:max-w-48 flex-1">
                      <Field label="برچسب (اختیاری)">
                        <Input
                          value={ad.label}
                          onChange={(e) => patchAddress(ad.id, { label: e.target.value })}
                          placeholder="مثلاً شعبه مرکزی"
                        />
                      </Field>
                    </div>
                    <div className="min-w-60 flex-[2]">
                      <Field label="آدرس">
                        <Input
                          value={ad.value}
                          onChange={(e) => patchAddress(ad.id, { value: e.target.value })}
                          placeholder="استان، شهر، خیابان، پلاک"
                        />
                      </Field>
                    </div>
                    <div className="mb-2 flex items-center gap-1">
                      <RowMoveButtons
                        onUp={() => moveAddress(ad.id, -1)}
                        onDown={() => moveAddress(ad.id, 1)}
                        disableUp={i === 0}
                        disableDown={i === form.addresses.length - 1}
                      />
                      <ConfirmButton onConfirm={() => removeAddress(ad.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ------------------------------------- اسلایدهای بنر (کاروسل) */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-content">اسلایدهای بنر اصلی</h2>
              <p className="text-sm text-content-muted mt-1">
                بنر بزرگ صفحه نخست به‌صورت خودکار بین این اسلایدها می‌چرخد
              </p>
            </div>
            <button
              type="button"
              onClick={addSlide}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
            >
              + افزودن اسلاید
            </button>
          </div>

          {form.heroSlides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-content-muted">
              هنوز اسلایدی اضافه نشده است. با دکمه «افزودن اسلاید» شروع کنید.
            </div>
          ) : (
            <div className="space-y-4">
              {form.heroSlides.map((slide, i) => (
                <div
                  key={slide.id}
                  className="rounded-2xl border border-border bg-surface-2/50 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-extrabold text-content">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-soft text-primary text-xs">
                        {i + 1}
                      </span>
                      اسلاید {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSlide(slide.id, -1)}
                        disabled={i === 0}
                        aria-label="انتقال به بالا"
                        className="rounded-lg p-1.5 text-content-muted hover:text-primary hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(slide.id, 1)}
                        disabled={i === form.heroSlides.length - 1}
                        aria-label="انتقال به پایین"
                        className="rounded-lg p-1.5 text-content-muted hover:text-primary hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <span className="mx-1">
                        <Toggle
                          checked={slide.active}
                          onChange={(v) => patchSlide(slide.id, { active: v })}
                          label={slide.active ? "فعال" : "غیرفعال"}
                        />
                      </span>
                      <ConfirmButton onConfirm={() => removeSlide(slide.id)} />
                    </div>
                  </div>

                  {/* Live preview first: it answers "what does this slide
                      currently look like?" whatever the image path is. */}
                  <SlidePreview slide={slide} />

                  <Field
                    label="تصویر اسلاید"
                    hint="تصویر دلخواه خود را بارگذاری کنید، یا یکی از بنرهای آماده را انتخاب کنید. فرمت JPG، PNG یا WebP و حداکثر ۵ مگابایت."
                  >
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => pickSlideImage(slide.id)}
                        disabled={uploadingSlide === slide.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-content transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        {uploadingSlide === slide.id ? (
                          <>
                            <Spinner />
                            در حال بارگذاری…
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                            </svg>
                            بارگذاری تصویر جدید
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {HERO_IMAGES.map((src) => (
                          <button
                            type="button"
                            key={src}
                            onClick={() => patchSlide(slide.id, { image: src })}
                            aria-pressed={slide.image === src}
                            aria-label={`انتخاب تصویر ${src}`}
                            className={`relative h-14 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                              slide.image === src
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-border-strong"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* The exact stored value, always visible and editable —
                          an uploaded image matches no swatch above. */}
                      <Input
                        value={slide.image}
                        onChange={(e) => patchSlide(slide.id, { image: e.target.value })}
                        dir="ltr"
                        placeholder="/images/toy-hero.jpg"
                        aria-label="مسیر تصویر اسلاید"
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="متن نشان (Badge)">
                      <Input
                        value={slide.badgeText}
                        onChange={(e) => patchSlide(slide.id, { badgeText: e.target.value })}
                        placeholder="مثلاً تا ۱۰٪ تخفیف"
                      />
                    </Field>
                    <Field label="عنوان">
                      <Input
                        value={slide.title}
                        onChange={(e) => patchSlide(slide.id, { title: e.target.value })}
                        placeholder="عنوان اصلی اسلاید"
                      />
                    </Field>
                    <Field label="زیرعنوان">
                      <Input
                        value={slide.subtitle}
                        onChange={(e) => patchSlide(slide.id, { subtitle: e.target.value })}
                        placeholder="توضیح کوتاه زیر عنوان"
                      />
                    </Field>
                    <Field label="متن دکمه">
                      <Input
                        value={slide.ctaText}
                        onChange={(e) => patchSlide(slide.id, { ctaText: e.target.value })}
                        placeholder="مثلاً مشاهده محصولات"
                      />
                    </Field>
                    <Field
                      label="لینک دکمه (صفحه‌ای که باز می‌شود)"
                      hint="مثلاً /products یا /category/3 یا /product/12 — یا یک آدرس کامل https://…"
                    >
                      <Input
                        value={slide.ctaHref}
                        onChange={(e) => patchSlide(slide.id, { ctaHref: e.target.value })}
                        dir="ltr"
                        placeholder="/products"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* One hidden picker shared by every slide row. */}
          <input
            ref={slideFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => void handleSlideFile(e)}
          />
        </Card>

        {/* ------------------------------------------- کارت کناری بنر */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">کارت کناری بنر اصلی</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="عنوان کارت کناری">
              <Input
                value={form.hero.sideTitle}
                onChange={(e) => patchHero({ sideTitle: e.target.value })}
              />
            </Field>
            <Field label="متن دکمه کارت کناری">
              <Input
                value={form.hero.sideCtaText}
                onChange={(e) => patchHero({ sideCtaText: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="متن کارت کناری">
                <Input
                  value={form.hero.sideText}
                  onChange={(e) => patchHero({ sideText: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* -------------------------------------------------- کمپین تخفیف */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-extrabold text-content">کمپین تخفیف</h2>
            <Toggle
              checked={form.saleEnabled}
              onChange={(v) => patch({ saleEnabled: v })}
              label={form.saleEnabled ? "کمپین فعال است" : "کمپین غیرفعال است"}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="درصد تخفیف سراسری">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.salePercent}
                onChange={(e) => patch({ salePercent: e.target.value })}
                dir="ltr"
              />
            </Field>
            <Field label="درصد روی نشان (Pill)">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.salePillPercent}
                onChange={(e) => patch({ salePillPercent: e.target.value })}
                dir="ltr"
              />
            </Field>
            <Field label="عنوان کمپین" hint="عبارت {percent} با درصد تخفیف جایگزین می‌شود">
              <Input
                value={form.saleTitle}
                onChange={(e) => patch({ saleTitle: e.target.value })}
              />
            </Field>
            <Field label="متن دکمه کمپین">
              <Input
                value={form.saleCtaText}
                onChange={(e) => patch({ saleCtaText: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        {/* ----------------------------------------------------------- ارسال */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">ارسال</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="حد ارسال رایگان (تومان)" hint="سفارش‌های بالاتر از این مبلغ ارسال رایگان دارند (۰ = همیشه رایگان)">
              <Input
                type="number"
                min={0}
                value={form.freeShippingThreshold}
                onChange={(e) => patch({ freeShippingThreshold: e.target.value })}
                dir="ltr"
              />
            </Field>
            <Field label="هزینه ارسال (تومان)">
              <Input
                type="number"
                min={0}
                value={form.shippingCost}
                onChange={(e) => patch({ shippingCost: e.target.value })}
                dir="ltr"
              />
            </Field>
          </div>
        </Card>

        {/* --------------------------------- فوتر و شبکه‌های اجتماعی */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">فوتر و شبکه‌های اجتماعی</h2>
          <div className="space-y-4">
            <Field label="درباره فروشگاه (فوتر)">
              <Textarea
                rows={3}
                value={form.footerAbout}
                onChange={(e) => patch({ footerAbout: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اینستاگرام">
                <Input
                  value={form.socials.instagram}
                  onChange={(e) => patchSocials({ instagram: e.target.value })}
                  dir="ltr"
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="فیس‌بوک">
                <Input
                  value={form.socials.facebook}
                  onChange={(e) => patchSocials({ facebook: e.target.value })}
                  dir="ltr"
                  placeholder="https://facebook.com/..."
                />
              </Field>
              <Field label="توییتر (X)">
                <Input
                  value={form.socials.twitter}
                  onChange={(e) => patchSocials({ twitter: e.target.value })}
                  dir="ltr"
                  placeholder="https://x.com/..."
                />
              </Field>
              <Field label="لینکدین">
                <Input
                  value={form.socials.linkedin}
                  onChange={(e) => patchSocials({ linkedin: e.target.value })}
                  dir="ltr"
                  placeholder="https://linkedin.com/company/..."
                />
              </Field>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={() => void handleSave()} disabled={saving}>
            {saving && <Spinner />}
            ذخیره تغییرات
          </Button>
        </div>
      </div>

      {toastNode}
    </div>
  );
}
