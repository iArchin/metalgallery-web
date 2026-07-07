"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { discountPercent, type Category, type Product } from "@/lib/types";
import { productImage, toyImage, PRODUCT_IMAGES } from "@/app/utils/images";
import { formatPersianNumber, toPersianNumber } from "@/app/utils/numbers";
import Button from "@/app/components/Button";
import {
  apiGet,
  apiSend,
  Badge,
  ConfirmButton,
  EmptyState,
  ErrorBlock,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  Table,
  Textarea,
  Toggle,
  useToast,
} from "@/app/admin/_components/ui";

/* --------------------------------------------------------------- form state */

interface ProductForm {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  ageGroup: string;
  stock: string;
  image: string;
  imageKeyword: string;
  imageLock: string;
  rating: string;
  reviewCount: string;
  isDeal: boolean;
  isFlashSale: boolean;
  isTrending: boolean;
  active: boolean;
  specifications: string; // one "کلید: مقدار" per line
}

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  categoryId: "",
  ageGroup: "",
  stock: "",
  image: "",
  imageKeyword: "",
  imageLock: "",
  rating: "4",
  reviewCount: "0",
  isDeal: false,
  isFlashSale: false,
  isTrending: false,
  active: true,
  specifications: "",
};

function serializeSpecs(specs: Record<string, string>): string {
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function parseSpecs(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

function toForm(p: Product): ProductForm {
  return {
    name: p.name,
    description: p.description,
    price: String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : "",
    categoryId: String(p.categoryId),
    ageGroup: p.ageGroup,
    stock: String(p.stock),
    image: p.image ?? "",
    imageKeyword: p.imageKeyword,
    imageLock: String(p.imageLock),
    rating: String(p.rating),
    reviewCount: String(p.reviewCount),
    isDeal: p.isDeal,
    isFlashSale: p.isFlashSale,
    isTrending: p.isTrending,
    active: p.active,
    specifications: serializeSpecs(p.specifications),
  };
}

/* --------------------------------------------------------------------- page */

export default function AdminProductsPage() {
  const { show, node: toastNode } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const data = await apiGet<Product[]>("/api/products?all=1");
    setProducts(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          apiGet<Product[]>("/api/products?all=1"),
          apiGet<Category[]>("/api/categories"),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setCategories(cats);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryName = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categories) map.set(c.id, c.name);
    return (id: number) => map.get(id) ?? "—";
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return products.filter((p) => {
      if (q && !p.name.includes(q)) return false;
      if (categoryFilter && p.categoryId !== Number(categoryFilter)) return false;
      return true;
    });
  }, [products, search, categoryFilter]);

  /* ---------------------------------------------------------- modal actions */

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(toForm(p));
    setModalOpen(true);
  };

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const liveDiscount = discountPercent({
    price: Number(form.price) || 0,
    originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : undefined,
  });

  const previewSrc =
    form.image || toyImage(form.imageKeyword.trim() || "toys", Number(form.imageLock) || 1, 200, 200);

  const submit = async () => {
    if (!form.name.trim()) return show("نام محصول را وارد کنید", "error");
    if (!(Number(form.price) > 0)) return show("قیمت معتبر وارد کنید", "error");
    if (!form.categoryId) return show("دسته‌بندی را انتخاب کنید", "error");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      categoryId: Number(form.categoryId),
      ageGroup: form.ageGroup.trim(),
      stock: Number(form.stock) || 0,
      rating: Math.min(5, Math.max(0, Number(form.rating) || 0)),
      reviewCount: Number(form.reviewCount) || 0,
      image: form.image,
      imageKeyword: form.imageKeyword.trim() || "toys",
      imageLock: Number(form.imageLock) || 1,
      isDeal: form.isDeal,
      isFlashSale: form.isFlashSale,
      isTrending: form.isTrending,
      active: form.active,
      specifications: parseSpecs(form.specifications),
    };

    setSaving(true);
    try {
      if (editingId === null) {
        await apiSend<Product>("/api/products", "POST", payload);
        show("محصول جدید ثبت شد");
      } else {
        await apiSend<Product>(`/api/products/${editingId}`, "PUT", payload);
        show("محصول به‌روزرسانی شد");
      }
      setModalOpen(false);
      await loadProducts();
    } catch (e) {
      show(e instanceof Error ? e.message : "خطا در ذخیره محصول", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------------------------- row actions */

  const toggleActive = async (p: Product, value: boolean) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: value } : x)));
    try {
      await apiSend<Product>(`/api/products/${p.id}`, "PUT", { active: value });
      show(value ? "محصول فعال شد" : "محصول غیرفعال شد");
    } catch (e) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !value } : x)));
      show(e instanceof Error ? e.message : "خطا در تغییر وضعیت", "error");
    }
  };

  const removeProduct = async (p: Product) => {
    try {
      await apiSend<null>(`/api/products/${p.id}`, "DELETE");
      show("محصول حذف شد");
      await loadProducts();
    } catch (e) {
      show(e instanceof Error ? e.message : "خطا در حذف محصول", "error");
    }
  };

  /* --------------------------------------------------------------- render */

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div>
      <PageHeader
        title="محصولات"
        subtitle={`${toPersianNumber(products.length)} محصول ثبت شده`}
        actions={
          <Button size="sm" onClick={openCreate}>
            محصول جدید
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نام محصول…"
            aria-label="جستجوی محصول"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="فیلتر دسته‌بندی"
          >
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="محصولی پیدا نشد" subtitle="عبارت جستجو یا فیلتر دسته را تغییر دهید" />
      ) : (
        <Table headers={["تصویر", "نام", "دسته", "قیمت", "تخفیف", "موجودی", "وضعیت", "بخش‌ها", "عملیات"]}>
          {filtered.map((p) => {
            const off = discountPercent(p);
            return (
              <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 rounded-lg bg-surface-2 overflow-hidden shrink-0">
                    <img
                      src={productImage(p, 96, 96)}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-content">{p.name}</span>
                  <span className="block text-xs text-content-subtle mt-0.5">{p.ageGroup}</span>
                </td>
                <td className="px-4 py-3 text-content-muted whitespace-nowrap">{categoryName(p.categoryId)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-content">
                  {formatPersianNumber(p.price)} تومان
                </td>
                <td className="px-4 py-3">
                  {off > 0 ? <Badge tone="primary">{toPersianNumber(off)}٪</Badge> : <span className="text-content-subtle">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.stock <= 5 ? "danger" : "neutral"}>{toPersianNumber(p.stock)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Toggle checked={p.active} onChange={(v) => toggleActive(p, v)} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {p.isDeal && <Badge tone="primary">پیشنهاد</Badge>}
                    {p.isFlashSale && <Badge tone="primary">ویژه</Badge>}
                    {p.isTrending && <Badge tone="primary">پرطرفدار</Badge>}
                    {!p.isDeal && !p.isFlashSale && !p.isTrending && (
                      <span className="text-content-subtle">—</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                    >
                      ویرایش
                    </button>
                    <ConfirmButton onConfirm={() => removeProduct(p)} />
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* ------------------------------------------------------ create/edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId === null ? "محصول جدید" : "ویرایش محصول"}
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <Field label="نام محصول">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً عروسک خرس مهربان" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="توضیحات">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="توضیح کوتاه درباره محصول…"
              />
            </Field>
          </div>

          <Field label="قیمت (تومان)">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="950000"
            />
          </Field>

          <Field
            label="قیمت قبل از تخفیف (تومان)"
            hint={
              liveDiscount > 0
                ? `درصد تخفیف: ${toPersianNumber(liveDiscount)}٪`
                : "خالی بگذارید اگر تخفیف ندارد"
            }
          >
            <Input
              type="number"
              min={0}
              value={form.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
              placeholder="—"
            />
          </Field>

          <Field label="دسته‌بندی">
            <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">انتخاب کنید…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="رده سنی">
            <Input value={form.ageGroup} onChange={(e) => set("ageGroup", e.target.value)} placeholder="مثلاً ۳-۸ سال" />
          </Field>

          <Field label="موجودی">
            <Input type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="10" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="امتیاز (۱ تا ۵)">
              <Input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
              />
            </Field>
            <Field label="تعداد نظرات">
              <Input
                type="number"
                min={0}
                value={form.reviewCount}
                onChange={(e) => set("reviewCount", e.target.value)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <span className="block text-sm font-bold text-content mb-1.5">تصویر محصول</span>
            <div className="flex flex-wrap items-center gap-2">
              {PRODUCT_IMAGES.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => set("image", src)}
                  aria-pressed={form.image === src}
                  className={`shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-border transition-shadow ${
                    form.image === src ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <img src={src} alt="تصویر محلی محصول" loading="lazy" className="w-16 h-16 rounded-xl object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("image", "")}
                aria-pressed={form.image === ""}
                className={`shrink-0 w-16 h-16 rounded-xl bg-surface-2 border border-border text-xs font-bold text-content-muted transition-shadow ${
                  form.image === "" ? "ring-2 ring-primary" : ""
                }`}
              >
                اینترنتی
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
            <div className="grid gap-4">
              <span className="block text-sm font-bold text-content -mb-2">
                تصویر جایگزین اینترنتی (وقتی تصویر محلی انتخاب نشده)
              </span>
              <Field label="کلیدواژه تصویر" hint="کلمات انگلیسی جدا شده با فاصله، مثلاً teddy bear">
                <Input
                  value={form.imageKeyword}
                  onChange={(e) => set("imageKeyword", e.target.value)}
                  placeholder="teddy bear"
                  dir="ltr"
                />
              </Field>
              <Field label="شناسه تصویر (lock)" hint="عدد را تغییر دهید تا عکس دیگری انتخاب شود">
                <Input
                  type="number"
                  min={1}
                  value={form.imageLock}
                  onChange={(e) => set("imageLock", e.target.value)}
                  placeholder="1"
                  dir="ltr"
                />
              </Field>
            </div>
            <div className="h-32 w-32 rounded-2xl bg-surface-2 overflow-hidden border border-border justify-self-center sm:justify-self-auto">
              <img
                key={previewSrc}
                src={previewSrc}
                alt="پیش‌نمایش تصویر محصول"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field label="مشخصات فنی" hint="هر خط: کلید: مقدار — مثلاً «جنس: پلاستیک»">
              <Textarea
                rows={4}
                value={form.specifications}
                onChange={(e) => set("specifications", e.target.value)}
                placeholder={"جنس: پلاستیک\nوزن: ۵۰۰ گرم"}
              />
            </Field>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-surface-2 border border-border px-4 py-3">
            <Toggle checked={form.isDeal} onChange={(v) => set("isDeal", v)} label="پیشنهاد روز" />
            <Toggle checked={form.isFlashSale} onChange={(v) => set("isFlashSale", v)} label="فروش ویژه" />
            <Toggle checked={form.isTrending} onChange={(v) => set("isTrending", v)} label="پرطرفدار" />
            <Toggle checked={form.active} onChange={(v) => set("active", v)} label="فعال" />
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              انصراف
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "در حال ذخیره…" : editingId === null ? "ثبت محصول" : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      </Modal>

      {toastNode}
    </div>
  );
}
