"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Category } from "@/lib/types";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  PageHeader,
  Table,
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

interface CategoryForm {
  name: string;
  imageKeyword: string;
  imageLock: string;
  active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  imageKeyword: "toy",
  imageLock: "1",
  active: true,
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  async function load() {
    try {
      setError(null);
      const data = await apiGet<Category[]>("/api/categories");
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

  function openEdit(c: Category) {
    setForm({
      name: c.name,
      imageKeyword: c.imageKeyword,
      imageLock: String(c.imageLock),
      active: c.active,
    });
    setEditing(c);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      show("نام دسته‌بندی الزامی است", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        imageKeyword: form.imageKeyword.trim() || "toy",
        imageLock: Number(form.imageLock) || 0,
        active: form.active,
      };
      if (editing === "new") {
        await apiSend<Category>("/api/categories", "POST", body);
        show("دسته‌بندی جدید افزوده شد");
      } else if (editing) {
        await apiSend<Category>(`/api/categories/${editing.id}`, "PUT", body);
        show("دسته‌بندی ویرایش شد");
      }
      setEditing(null);
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Category) {
    try {
      await apiSend<Category>(`/api/categories/${c.id}`, "PUT", { active: !c.active });
      show(c.active ? "دسته‌بندی غیرفعال شد" : "دسته‌بندی فعال شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در تغییر وضعیت", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiSend<null>(`/api/categories/${id}`, "DELETE");
      show("دسته‌بندی حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در حذف", "error");
    }
  }

  const previewSrc = toyImage(form.imageKeyword.trim() || "toy", Number(form.imageLock) || 0, 300, 300);

  return (
    <div>
      <PageHeader
        title="دسته‌بندی‌ها"
        subtitle="مدیریت دسته‌بندی‌های فروشگاه"
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
          >
            + افزودن دسته‌بندی
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : items.length === 0 ? (
        <EmptyState title="دسته‌بندی‌ای ثبت نشده است" subtitle="با دکمه «افزودن» اولین دسته‌بندی را بسازید." />
      ) : (
        <Table headers={["تصویر", "نام", "کلیدواژه تصویر", "وضعیت", "عملیات"]}>
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
              <td className="px-4 py-3">
                <div className="h-12 w-12 rounded-xl bg-surface-2 overflow-hidden border border-border">
                  <img
                    src={toyImage(c.imageKeyword, c.imageLock, 100, 100)}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </td>
              <td className="px-4 py-3 font-bold text-content whitespace-nowrap">{c.name}</td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap" dir="ltr">
                {c.imageKeyword}
                <span className="text-content-subtle text-xs"> #{toPersianNumber(c.imageLock)}</span>
              </td>
              <td className="px-4 py-3">
                <Toggle
                  checked={c.active}
                  onChange={() => void toggleActive(c)}
                  label={c.active ? "فعال" : "غیرفعال"}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                  >
                    ویرایش
                  </button>
                  <ConfirmButton onConfirm={() => void handleDelete(c.id)} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "افزودن دسته‌بندی" : "ویرایش دسته‌بندی"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="نام دسته‌بندی">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثلاً عروسک و پولیشی"
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
                alt="پیش‌نمایش دسته‌بندی"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <Toggle
            checked={form.active}
            onChange={(v) => setForm({ ...form, active: v })}
            label="نمایش در فروشگاه (فعال)"
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
