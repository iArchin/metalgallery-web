"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { NewsItem } from "@/lib/types";
import {
  apiGet,
  apiSend,
  PageHeader,
  Field,
  Input,
  Textarea,
  Toggle,
  Badge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Table,
  Modal,
  ConfirmButton,
  useToast,
} from "@/app/admin/_components/ui";

interface NewsForm {
  title: string;
  body: string;
  date: string;
  tag: string;
  published: boolean;
}

const EMPTY_FORM: NewsForm = {
  title: "",
  body: "",
  date: "",
  tag: "",
  published: true,
};

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NewsForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { show, node: toast } = useToast();

  const load = useCallback(async () => {
    try {
      setNews(await apiGet<NewsItem[]>("/api/news"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای سرور");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof NewsForm>(key: K, value: NewsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (n: NewsItem) => {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body,
      date: n.date,
      tag: n.tag,
      published: n.published,
    });
    setModalOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      show("عنوان خبر الزامی است", "error");
      return;
    }
    if (!form.body.trim()) {
      show("متن خبر الزامی است", "error");
      return;
    }
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      date: form.date.trim(),
      tag: form.tag.trim(),
      published: form.published,
    };
    setSaving(true);
    try {
      if (editingId === null) {
        await apiSend<NewsItem>("/api/news", "POST", payload);
        show("خبر جدید ایجاد شد");
      } else {
        await apiSend<NewsItem>(`/api/news/${editingId}`, "PUT", payload);
        show("خبر ویرایش شد");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (n: NewsItem, published: boolean) => {
    setNews(
      (list) =>
        list?.map((x) => (x.id === n.id ? { ...x, published } : x)) ?? null
    );
    try {
      await apiSend<NewsItem>(`/api/news/${n.id}`, "PUT", { published });
      show(published ? "خبر منتشر شد" : "خبر از انتشار خارج شد");
    } catch (err) {
      setNews(
        (list) =>
          list?.map((x) =>
            x.id === n.id ? { ...x, published: n.published } : x
          ) ?? null
      );
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    }
  };

  const remove = async (id: number) => {
    try {
      await apiSend<{ id: number }>(`/api/news/${id}`, "DELETE");
      show("خبر حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="اخبار"
        subtitle="مدیریت اخبار و اطلاعیه‌های فروشگاه"
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
          >
            + خبر جدید
          </button>
        }
      />

      {error ? (
        <ErrorBlock message={error} />
      ) : news === null ? (
        <LoadingBlock />
      ) : news.length === 0 ? (
        <EmptyState
          title="هنوز خبری ثبت نشده است"
          subtitle="با دکمه «خبر جدید» اولین خبر را بنویسید."
        />
      ) : (
        <Table headers={["عنوان", "برچسب", "تاریخ", "انتشار", "عملیات"]}>
          {news.map((n) => (
            <tr key={n.id} className="hover:bg-surface-2/60 transition-colors">
              <td className="px-4 py-3 font-bold text-content">
                <span className="line-clamp-2 max-w-[320px]">{n.title}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {n.tag ? <Badge tone="primary">{n.tag}</Badge> : "—"}
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {n.date || "—"}
              </td>
              <td className="px-4 py-3">
                <Toggle
                  checked={n.published}
                  onChange={(v) => togglePublished(n, v)}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => openEdit(n)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-surface-2 transition-colors"
                >
                  ویرایش
                </button>
                <ConfirmButton onConfirm={() => remove(n.id)} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId === null ? "خبر جدید" : "ویرایش خبر"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="عنوان خبر">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="عنوان خبر"
              required
            />
          </Field>
          <Field label="متن خبر">
            <Textarea
              rows={5}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="تاریخ نمایش" hint="مثلاً «۱۵ خرداد ۱۴۰۵»">
              <Input
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field label="برچسب">
              <Input
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="مثلاً رویداد"
              />
            </Field>
          </div>
          <Toggle
            checked={form.published}
            onChange={(v) => set("published", v)}
            label="منتشر شود"
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-content-muted hover:text-content transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </button>
          </div>
        </form>
      </Modal>

      {toast}
    </div>
  );
}
