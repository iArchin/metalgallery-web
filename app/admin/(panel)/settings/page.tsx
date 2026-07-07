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
  LoadingBlock,
  ErrorBlock,
  Spinner,
  useToast,
} from "@/app/admin/_components/ui";

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

  async function handleSave() {
    if (!form) return;
    if (!form.siteName.trim()) {
      show("نام فروشگاه الزامی است", "error");
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

        {/* ------------------------------------------------------ بنر اصلی */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">بنر اصلی صفحه نخست</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="متن نشان (Badge)">
              <Input
                value={form.hero.badgeText}
                onChange={(e) => patchHero({ badgeText: e.target.value })}
                placeholder="مثلاً تا ۱۰٪ تخفیف"
              />
            </Field>
            <Field label="عنوان بنر">
              <Input
                value={form.hero.title}
                onChange={(e) => patchHero({ title: e.target.value })}
              />
            </Field>
            <Field label="متن دکمه بنر">
              <Input
                value={form.hero.ctaText}
                onChange={(e) => patchHero({ ctaText: e.target.value })}
              />
            </Field>
            <Field label="عنوان کارت کناری">
              <Input
                value={form.hero.sideTitle}
                onChange={(e) => patchHero({ sideTitle: e.target.value })}
              />
            </Field>
            <Field label="متن کارت کناری">
              <Input
                value={form.hero.sideText}
                onChange={(e) => patchHero({ sideText: e.target.value })}
              />
            </Field>
            <Field label="متن دکمه کارت کناری">
              <Input
                value={form.hero.sideCtaText}
                onChange={(e) => patchHero({ sideCtaText: e.target.value })}
              />
            </Field>
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
