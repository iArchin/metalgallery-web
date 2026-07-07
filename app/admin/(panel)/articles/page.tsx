"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Article } from "@/lib/types";
import { toyImage } from "@/app/utils/images";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  PageHeader,
  Field,
  Input,
  Textarea,
  Toggle,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Table,
  Modal,
  ConfirmButton,
  useToast,
} from "@/app/admin/_components/ui";

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string; // textarea text — paragraphs separated by blank lines
  date: string;
  author: string;
  category: string;
  readingMinutes: string;
  imageKeyword: string;
  imageLock: string;
  published: boolean;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  date: "",
  author: "",
  category: "",
  readingMinutes: "5",
  imageKeyword: "toys",
  imageLock: "1",
  published: true,
};

export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { show, node: toast } = useToast();

  const load = useCallback(async () => {
    try {
      setArticles(await apiGet<Article[]>("/api/articles"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای سرور");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content.join("\n\n"),
      date: a.date,
      author: a.author,
      category: a.category,
      readingMinutes: String(a.readingMinutes),
      imageKeyword: a.imageKeyword,
      imageLock: String(a.imageLock),
      published: a.published,
    });
    setModalOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const content = form.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!form.title.trim()) {
      show("عنوان مقاله الزامی است", "error");
      return;
    }
    if (content.length === 0) {
      show("متن مقاله الزامی است", "error");
      return;
    }
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content,
      date: form.date.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      readingMinutes: Number(form.readingMinutes) || 1,
      imageKeyword: form.imageKeyword.trim() || "toys",
      imageLock: Number(form.imageLock) || 0,
      published: form.published,
    };
    setSaving(true);
    try {
      if (editingId === null) {
        await apiSend<Article>("/api/articles", "POST", payload);
        show("مقاله جدید ایجاد شد");
      } else {
        await apiSend<Article>(`/api/articles/${editingId}`, "PUT", payload);
        show("مقاله ویرایش شد");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (a: Article, published: boolean) => {
    setArticles(
      (list) =>
        list?.map((x) => (x.id === a.id ? { ...x, published } : x)) ?? null
    );
    try {
      await apiSend<Article>(`/api/articles/${a.id}`, "PUT", { published });
      show(published ? "مقاله منتشر شد" : "مقاله از انتشار خارج شد");
    } catch (err) {
      setArticles(
        (list) =>
          list?.map((x) =>
            x.id === a.id ? { ...x, published: a.published } : x
          ) ?? null
      );
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    }
  };

  const remove = async (id: number) => {
    try {
      await apiSend<{ id: number }>(`/api/articles/${id}`, "DELETE");
      show("مقاله حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطای سرور", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="مقالات"
        subtitle="مدیریت مقالات وبلاگ فروشگاه"
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover transition-colors"
          >
            + مقاله جدید
          </button>
        }
      />

      {error ? (
        <ErrorBlock message={error} />
      ) : articles === null ? (
        <LoadingBlock />
      ) : articles.length === 0 ? (
        <EmptyState
          title="هنوز مقاله‌ای ثبت نشده است"
          subtitle="با دکمه «مقاله جدید» اولین مقاله را بنویسید."
        />
      ) : (
        <Table
          headers={[
            "تصویر",
            "عنوان",
            "دسته",
            "تاریخ",
            "زمان مطالعه",
            "انتشار",
            "عملیات",
          ]}
        >
          {articles.map((a) => (
            <tr key={a.id} className="hover:bg-surface-2/60 transition-colors">
              <td className="px-4 py-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-surface-2 overflow-hidden">
                  <img
                    src={toyImage(a.imageKeyword, a.imageLock, 96, 96)}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </td>
              <td className="px-4 py-3 font-bold text-content">
                <span className="line-clamp-2 max-w-[260px]">{a.title}</span>
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {a.category || "—"}
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {a.date || "—"}
              </td>
              <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                {toPersianNumber(a.readingMinutes)} دقیقه
              </td>
              <td className="px-4 py-3">
                <Toggle
                  checked={a.published}
                  onChange={(v) => togglePublished(a, v)}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => openEdit(a)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-surface-2 transition-colors"
                >
                  ویرایش
                </button>
                <ConfirmButton onConfirm={() => remove(a.id)} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId === null ? "مقاله جدید" : "ویرایش مقاله"}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="عنوان مقاله">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="عنوان مقاله"
              required
            />
          </Field>
          <Field label="خلاصه">
            <Textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="خلاصه کوتاه برای فهرست مقالات"
            />
          </Field>
          <Field label="متن مقاله" hint="پاراگراف‌ها را با یک خط خالی جدا کنید">
            <Textarea
              rows={8}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
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
            <Field label="نویسنده">
              <Input
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
              />
            </Field>
            <Field label="دسته‌بندی">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="مثلاً راهنمای خرید"
              />
            </Field>
            <Field label="زمان مطالعه (دقیقه)">
              <Input
                type="number"
                min={1}
                value={form.readingMinutes}
                onChange={(e) => set("readingMinutes", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <Field label="کلیدواژه تصویر" hint="کلمات انگلیسی با فاصله، مثلاً teddy bear">
                <Input
                  dir="ltr"
                  value={form.imageKeyword}
                  onChange={(e) => set("imageKeyword", e.target.value)}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="قفل تصویر" hint="عدد را تغییر دهید تا عکس دیگری ببینید">
                <Input
                  dir="ltr"
                  type="number"
                  value={form.imageLock}
                  onChange={(e) => set("imageLock", e.target.value)}
                />
              </Field>
            </div>
            <div className="h-20 w-20 shrink-0 rounded-xl border border-border bg-surface-2 overflow-hidden">
              {form.imageKeyword.trim() && (
                <img
                  key={`${form.imageKeyword}-${form.imageLock}`}
                  src={toyImage(
                    form.imageKeyword,
                    Number(form.imageLock) || 0,
                    160,
                    160
                  )}
                  alt="پیش‌نمایش تصویر مقاله"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
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
