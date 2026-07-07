"use client";

import { useEffect, useState } from "react";
import type { AboutContent } from "@/lib/types";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import Button from "@/app/components/Button";
import {
  apiGet,
  apiSend,
  PageHeader,
  Card,
  Field,
  Input,
  Textarea,
  LoadingBlock,
  ErrorBlock,
  Spinner,
  useToast,
} from "@/app/admin/_components/ui";

interface AboutForm {
  heroTitle: string;
  heroText: string;
  storyTitle: string;
  storyParagraphsText: string; // paragraphs joined with blank lines
  storyImageKeyword: string;
  storyImageLock: string;
  stats: { value: string; label: string }[];
  values: { title: string; text: string }[];
  ctaTitle: string;
  ctaButton: string;
}

function toForm(c: AboutContent): AboutForm {
  return {
    heroTitle: c.heroTitle,
    heroText: c.heroText,
    storyTitle: c.storyTitle,
    storyParagraphsText: c.storyParagraphs.join("\n\n"),
    storyImageKeyword: c.storyImageKeyword,
    storyImageLock: String(c.storyImageLock),
    stats: c.stats.map((s) => ({ ...s })),
    values: c.values.map((v) => ({ ...v })),
    ctaTitle: c.ctaTitle,
    ctaButton: c.ctaButton,
  };
}

export default function AdminPagesPage() {
  const [form, setForm] = useState<AboutForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  useEffect(() => {
    apiGet<AboutContent>("/api/pages/about")
      .then((data) => setForm(toForm(data)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات")
      )
      .finally(() => setLoading(false));
  }, []);

  function patch(p: Partial<AboutForm>) {
    setForm((f) => (f ? { ...f, ...p } : f));
  }

  function updateStat(i: number, key: "value" | "label", val: string) {
    if (!form) return;
    const stats = form.stats.map((s, idx) => (idx === i ? { ...s, [key]: val } : s));
    patch({ stats });
  }

  function updateValue(i: number, key: "title" | "text", val: string) {
    if (!form) return;
    const values = form.values.map((v, idx) => (idx === i ? { ...v, [key]: val } : v));
    patch({ values });
  }

  function addStat() {
    if (!form) return;
    patch({ stats: [...form.stats, { value: "", label: "" }] });
  }

  function removeStat(i: number) {
    if (!form) return;
    patch({ stats: form.stats.filter((_, idx) => idx !== i) });
  }

  function addValue() {
    if (!form) return;
    patch({ values: [...form.values, { title: "", text: "" }] });
  }

  function removeValue(i: number) {
    if (!form) return;
    patch({ values: form.values.filter((_, idx) => idx !== i) });
  }

  async function handleSave() {
    if (!form) return;
    if (!form.heroTitle.trim()) {
      show("عنوان سربرگ الزامی است", "error");
      return;
    }
    setSaving(true);
    try {
      const body: AboutContent = {
        heroTitle: form.heroTitle.trim(),
        heroText: form.heroText.trim(),
        storyTitle: form.storyTitle.trim(),
        storyParagraphs: form.storyParagraphsText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
        storyImageKeyword: form.storyImageKeyword.trim() || "toy",
        storyImageLock: Number(form.storyImageLock) || 0,
        stats: form.stats
          .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
          .filter((s) => s.value || s.label),
        values: form.values
          .map((v) => ({ title: v.title.trim(), text: v.text.trim() }))
          .filter((v) => v.title || v.text),
        ctaTitle: form.ctaTitle.trim(),
        ctaButton: form.ctaButton.trim(),
      };
      const data = await apiSend<AboutContent>("/api/pages/about", "PUT", body);
      setForm(toForm(data));
      show("محتوای صفحه «درباره ما» ذخیره شد");
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="صفحه درباره ما" subtitle="ویرایش محتوای صفحه «درباره ما»" />
        <LoadingBlock />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div>
        <PageHeader title="صفحه درباره ما" subtitle="ویرایش محتوای صفحه «درباره ما»" />
        <ErrorBlock message={error ?? "خطا در دریافت اطلاعات"} />
      </div>
    );
  }

  const previewSrc = toyImage(
    form.storyImageKeyword.trim() || "toy",
    Number(form.storyImageLock) || 0,
    400,
    300
  );

  return (
    <div>
      <PageHeader
        title="صفحه درباره ما"
        subtitle="محتوای بخش‌های مختلف صفحه «درباره ما» را ویرایش کنید"
      />

      <div className="space-y-5">
        {/* --------------------------------------------------------- سربرگ */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">سربرگ صفحه</h2>
          <div className="space-y-4">
            <Field label="عنوان سربرگ">
              <Input
                value={form.heroTitle}
                onChange={(e) => patch({ heroTitle: e.target.value })}
                placeholder="مثلاً قصه فروشگاه ما"
              />
            </Field>
            <Field label="متن سربرگ">
              <Textarea
                rows={3}
                value={form.heroText}
                onChange={(e) => patch({ heroText: e.target.value })}
                placeholder="توضیح کوتاهی که زیر عنوان نمایش داده می‌شود"
              />
            </Field>
          </div>
        </Card>

        {/* --------------------------------------------------------- قصه ما */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">قصه ما</h2>
          <div className="space-y-4">
            <Field label="عنوان بخش">
              <Input
                value={form.storyTitle}
                onChange={(e) => patch({ storyTitle: e.target.value })}
              />
            </Field>
            <Field
              label="پاراگراف‌های داستان"
              hint="هر پاراگراف را با یک خط خالی از پاراگراف بعدی جدا کنید"
            >
              <Textarea
                rows={8}
                value={form.storyParagraphsText}
                onChange={(e) => patch({ storyParagraphsText: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="کلیدواژه تصویر" hint="کلمات انگلیسی، مثلاً toy store">
                <Input
                  value={form.storyImageKeyword}
                  onChange={(e) => patch({ storyImageKeyword: e.target.value })}
                  dir="ltr"
                  placeholder="toy store"
                />
              </Field>
              <Field label="کد تصویر (lock)" hint="با تغییر عدد، عکس دیگری انتخاب می‌شود">
                <Input
                  type="number"
                  min={0}
                  value={form.storyImageLock}
                  onChange={(e) => patch({ storyImageLock: e.target.value })}
                  dir="ltr"
                />
              </Field>
            </div>
            <div>
              <span className="block text-sm font-bold text-content mb-1.5">پیش‌نمایش تصویر</span>
              <div className="h-36 w-48 rounded-2xl bg-surface-2 overflow-hidden border border-border">
                <img
                  key={previewSrc}
                  src={previewSrc}
                  alt="پیش‌نمایش تصویر داستان"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* --------------------------------------------------------- آمارها */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-content">آمارها</h2>
            <button
              type="button"
              onClick={addStat}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary-soft transition-colors"
            >
              + افزودن آمار
            </button>
          </div>
          <div className="space-y-3">
            {form.stats.length === 0 && (
              <p className="text-sm text-content-muted">آماری ثبت نشده است.</p>
            )}
            {form.stats.map((s, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <Field label={`مقدار آمار ${toPersianNumber(i + 1)}`}>
                    <Input
                      value={s.value}
                      onChange={(e) => updateStat(i, "value", e.target.value)}
                      placeholder="مثلاً +۱۲۰۰۰"
                    />
                  </Field>
                </div>
                <div className="flex-[2]">
                  <Field label="برچسب">
                    <Input
                      value={s.label}
                      onChange={(e) => updateStat(i, "label", e.target.value)}
                      placeholder="مثلاً مشتری خوشحال"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => removeStat(i)}
                  className="self-start sm:self-auto rounded-lg px-2.5 py-2.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* -------------------------------------------------------- ارزش‌ها */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-content">ارزش‌های ما</h2>
            <button
              type="button"
              onClick={addValue}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary-soft transition-colors"
            >
              + افزودن ارزش
            </button>
          </div>
          <div className="space-y-3">
            {form.values.length === 0 && (
              <p className="text-sm text-content-muted">ارزشی ثبت نشده است.</p>
            )}
            {form.values.map((v, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <Field label={`عنوان ارزش ${toPersianNumber(i + 1)}`}>
                    <Input
                      value={v.title}
                      onChange={(e) => updateValue(i, "title", e.target.value)}
                      placeholder="مثلاً کیفیت و ایمنی"
                    />
                  </Field>
                </div>
                <div className="flex-[2]">
                  <Field label="توضیح">
                    <Input
                      value={v.text}
                      onChange={(e) => updateValue(i, "text", e.target.value)}
                      placeholder="توضیح کوتاه این ارزش"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => removeValue(i)}
                  className="self-start sm:self-auto rounded-lg px-2.5 py-2.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* ------------------------------------------------------------ CTA */}
        <Card className="p-5">
          <h2 className="font-extrabold text-content mb-4">دعوت به اقدام (CTA)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="عنوان CTA">
              <Input
                value={form.ctaTitle}
                onChange={(e) => patch({ ctaTitle: e.target.value })}
                placeholder="مثلاً آماده‌اید خرید را شروع کنید؟"
              />
            </Field>
            <Field label="متن دکمه CTA">
              <Input
                value={form.ctaButton}
                onChange={(e) => patch({ ctaButton: e.target.value })}
                placeholder="مثلاً مشاهده فروشگاه"
              />
            </Field>
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
