"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Brand } from "@/lib/types";
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

interface BrandForm {
  name: string;
  items: string;
  active: boolean;
}

const EMPTY_FORM: BrandForm = {
  name: "",
  items: "0",
  active: true,
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { show, node: toastNode } = useToast();

  async function load() {
    try {
      setError(null);
      const data = await apiGet<Brand[]>("/api/brands");
      setBrands(data);
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

  function openEdit(b: Brand) {
    setForm({
      name: b.name,
      items: String(b.items),
      active: b.active,
    });
    setEditing(b);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      show("نام برند الزامی است", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        items: Math.max(0, Number(form.items) || 0),
        active: form.active,
      };
      if (editing === "new") {
        await apiSend<Brand>("/api/brands", "POST", body);
        show("برند جدید افزوده شد");
      } else if (editing) {
        await apiSend<Brand>(`/api/brands/${editing.id}`, "PUT", body);
        show("برند ویرایش شد");
      }
      setEditing(null);
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Brand) {
    try {
      await apiSend<Brand>(`/api/brands/${b.id}`, "PUT", { active: !b.active });
      show(b.active ? "برند غیرفعال شد" : "برند فعال شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در تغییر وضعیت", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiSend<null>(`/api/brands/${id}`, "DELETE");
      show("برند حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در حذف", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="برندها"
        subtitle="مدیریت برندهای همکار فروشگاه"
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
          >
            + افزودن برند
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : brands.length === 0 ? (
        <EmptyState title="برندی ثبت نشده است" subtitle="با دکمه «افزودن» اولین برند را بسازید." />
      ) : (
        <Table headers={["نام برند", "تعداد کالا", "وضعیت", "عملیات"]}>
          {brands.map((b) => (
            <tr key={b.id} className="hover:bg-surface-2/50 transition-colors">
              <td className="px-4 py-3 font-bold text-content whitespace-nowrap">{b.name}</td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {toPersianNumber(b.items)} کالا
              </td>
              <td className="px-4 py-3">
                <Toggle
                  checked={b.active}
                  onChange={() => void toggleActive(b)}
                  label={b.active ? "فعال" : "غیرفعال"}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(b)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                  >
                    ویرایش
                  </button>
                  <ConfirmButton onConfirm={() => void handleDelete(b.id)} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "افزودن برند" : "ویرایش برند"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="نام برند">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثلاً لگو"
              required
            />
          </Field>

          <Field label="تعداد کالا">
            <Input
              type="number"
              min={0}
              value={form.items}
              onChange={(e) => setForm({ ...form, items: e.target.value })}
              dir="ltr"
            />
          </Field>

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
