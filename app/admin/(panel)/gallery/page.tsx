"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { GalleryItem } from "@/lib/types";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  PageHeader,
  Card,
  Modal,
  Field,
  Input,
  Toggle,
  ConfirmButton,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Spinner,
  useToast,
} from "@/app/admin/_components/ui";

interface GalleryForm {
  caption: string;
  imageKeyword: string;
  imageLock: string;
  active: boolean;
}

const EMPTY_FORM: GalleryForm = {
  caption: "",
  imageKeyword: "toy",
  imageLock: "1",
  active: true,
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GalleryItem | "new" | null>(null);
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  async function load() {
    try {
      setError(null);
      const data = await apiGet<GalleryItem[]>("/api/gallery");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function openEdit(item: GalleryItem) {
    setForm({
      caption: item.caption,
      imageKeyword: item.imageKeyword,
      imageLock: String(item.imageLock),
      active: item.active,
    });
    setEditing(item);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.caption.trim()) {
      show("عنوان تصویر الزامی است", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        caption: form.caption.trim(),
        imageKeyword: form.imageKeyword.trim() || "toy",
        imageLock: Number(form.imageLock) || 0,
        active: form.active,
      };
      if (editing === "new") {
        await apiSend<GalleryItem>("/api/gallery", "POST", body);
        show("تصویر جدید به گالری افزوده شد");
      } else if (editing) {
        await apiSend<GalleryItem>(`/api/gallery/${editing.id}`, "PUT", body);
        show("تصویر گالری ویرایش شد");
      }
      setEditing(null);
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: GalleryItem) {
    try {
      await apiSend<GalleryItem>(`/api/gallery/${item.id}`, "PUT", { active: !item.active });
      show(item.active ? "تصویر غیرفعال شد" : "تصویر فعال شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در تغییر وضعیت", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiSend<null>(`/api/gallery/${id}`, "DELETE");
      show("تصویر از گالری حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در حذف", "error");
    }
  }

  const previewSrc = toyImage(form.imageKeyword.trim() || "toy", Number(form.imageLock) || 0, 300, 300);

  return (
    <div>
      <PageHeader
        title="گالری تصاویر"
        subtitle="مدیریت تصاویر گالری سایت"
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
          >
            + افزودن تصویر
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : items.length === 0 ? (
        <EmptyState title="تصویری در گالری نیست" subtitle="با دکمه «افزودن تصویر» اولین تصویر را ثبت کنید." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square rounded-xl bg-surface-2 overflow-hidden m-3 mb-0">
                <img
                  src={toyImage(item.imageKeyword, item.imageLock, 400, 400)}
                  alt={item.caption}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2.5">
                <p className="font-bold text-sm text-content truncate" title={item.caption}>
                  {item.caption}
                </p>
                <p className="text-xs text-content-subtle truncate" dir="ltr">
                  {item.imageKeyword} #{toPersianNumber(item.imageLock)}
                </p>
                <Toggle
                  checked={item.active}
                  onChange={() => void toggleActive(item)}
                  label={item.active ? "فعال" : "غیرفعال"}
                />
                <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                  >
                    ویرایش
                  </button>
                  <ConfirmButton onConfirm={() => void handleDelete(item.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "افزودن تصویر" : "ویرایش تصویر"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="عنوان تصویر">
            <Input
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="مثلاً جشن رونمایی محصولات جدید"
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="کلیدواژه تصویر" hint="کلمات انگلیسی جدا شده با فاصله، مثلاً teddy bear">
              <Input
                value={form.imageKeyword}
                onChange={(e) => setForm({ ...form, imageKeyword: e.target.value })}
                dir="ltr"
                placeholder="teddy bear"
              />
            </Field>
            <Field label="کد تصویر (lock)" hint="با تغییر عدد، عکس دیگری انتخاب می‌شود">
              <Input
                type="number"
                min={0}
                value={form.imageLock}
                onChange={(e) => setForm({ ...form, imageLock: e.target.value })}
                dir="ltr"
              />
            </Field>
          </div>

          <div>
            <span className="block text-sm font-bold text-content mb-1.5">پیش‌نمایش تصویر</span>
            <div className="h-32 w-32 rounded-2xl bg-surface-2 overflow-hidden border border-border">
              <img
                key={previewSrc}
                src={previewSrc}
                alt="پیش‌نمایش تصویر گالری"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <Toggle
            checked={form.active}
            onChange={(v) => setForm({ ...form, active: v })}
            label="نمایش در گالری سایت (فعال)"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-content-muted hover:text-content hover:bg-surface-2 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving && <Spinner />}
              {editing === "new" ? "افزودن" : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </Modal>

      {toastNode}
    </div>
  );
}
