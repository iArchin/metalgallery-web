"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import Button from "@/app/components/Button";
import {
  apiGet,
  apiSend,
  PageHeader,
  Card,
  Field,
  Input,
  Textarea,
  Toggle,
  ConfirmButton,
  LoadingBlock,
  ErrorBlock,
  Spinner,
  useToast,
} from "@/app/admin/_components/ui";

/** Local banner images an admin can pick for a hero slide. */
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
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        workingHours: form.workingHours.trim(),
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
      show("تنظیمات سایت ذخیره شد");
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
            <Field label="شماره تماس">
              <Input
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                dir="ltr"
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
            <Field label="آدرس">
              <Input
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
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

                  <Field label="تصویر اسلاید">
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
                    <Field label="لینک دکمه" hint="مثلاً /products یا /product/12">
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
