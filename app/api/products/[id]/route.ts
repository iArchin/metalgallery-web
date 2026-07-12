import {
  getProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import { parseProductImages, isUploadedProductImage } from "@/lib/server/uploads";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ ok: false, error: "شناسه محصول نامعتبر است" }, { status: 400 });
  }
  const product = await getProduct(id);
  if (!product) {
    return Response.json({ ok: false, error: "محصول یافت نشد" }, { status: 404 });
  }
  return Response.json({ ok: true, data: product });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ ok: false, error: "شناسه محصول نامعتبر است" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const patch: Partial<ProductInput> = {};

  // ---- strings
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return Response.json({ ok: false, error: "نام محصول نامعتبر است" }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.ageGroup !== undefined) patch.ageGroup = String(body.ageGroup);
  if (body.imageKeyword !== undefined) {
    const kw = typeof body.imageKeyword === "string" ? body.imageKeyword.trim() : "";
    if (!kw) {
      return Response.json({ ok: false, error: "کلیدواژه تصویر نامعتبر است" }, { status: 400 });
    }
    patch.imageKeyword = kw;
  }

  // image: local path under /images/ or an uploaded photo; explicit empty
  // clears it (falls back to the internet keyword photo)
  if ("image" in body) {
    const raw = body.image;
    if (raw === null || raw === undefined || raw === "") {
      patch.image = undefined;
    } else if (
      typeof raw === "string" &&
      (raw.startsWith("/images/") || isUploadedProductImage(raw))
    ) {
      patch.image = raw;
    } else {
      return Response.json({ ok: false, error: "آدرس تصویر نامعتبر است" }, { status: 400 });
    }
  }

  // images: the uploaded gallery (1..6). The main photo mirrors entry 0 —
  // set after the `image` block above so the sync always wins.
  if (body.images !== undefined) {
    const images = parseProductImages(body.images);
    if (!images) {
      return Response.json(
        { ok: false, error: "بین ۱ تا ۶ تصویر برای محصول بارگذاری کنید" },
        { status: 400 }
      );
    }
    patch.images = images;
    patch.image = images[0];
  }

  // ---- numbers
  const numberFields: {
    key: "price" | "categoryId" | "stock" | "rating" | "reviewCount" | "imageLock";
    min: number;
    error: string;
  }[] = [
    { key: "price", min: 1, error: "قیمت محصول نامعتبر است" },
    { key: "categoryId", min: 1, error: "دسته‌بندی محصول نامعتبر است" },
    { key: "stock", min: 0, error: "موجودی محصول نامعتبر است" },
    { key: "rating", min: 0, error: "امتیاز محصول نامعتبر است" },
    { key: "reviewCount", min: 0, error: "تعداد نظرات نامعتبر است" },
    { key: "imageLock", min: 0, error: "شناسه تصویر نامعتبر است" },
  ];
  for (const field of numberFields) {
    if (body[field.key] === undefined) continue;
    const n = Number(body[field.key]);
    if (!Number.isFinite(n) || n < field.min) {
      return Response.json({ ok: false, error: field.error }, { status: 400 });
    }
    patch[field.key] = field.key === "rating" ? Math.min(5, Math.floor(n)) : Math.floor(n);
  }

  // originalPrice: null/undefined-in-body clears it, otherwise coerce
  if ("originalPrice" in body) {
    const raw = body.originalPrice;
    if (raw === null || raw === undefined || raw === "") {
      patch.originalPrice = undefined; // explicit key clears the stored value
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        return Response.json(
          { ok: false, error: "قیمت قبل از تخفیف نامعتبر است" },
          { status: 400 }
        );
      }
      patch.originalPrice = Math.floor(n);
    }
  }

  // ---- booleans
  if (body.isDeal !== undefined) patch.isDeal = body.isDeal === true;
  if (body.isFlashSale !== undefined) patch.isFlashSale = body.isFlashSale === true;
  if (body.isTrending !== undefined) patch.isTrending = body.isTrending === true;
  if (body.active !== undefined) patch.active = body.active === true;

  // ---- specifications
  if (body.specifications !== undefined) {
    const specs: Record<string, string> = {};
    if (
      body.specifications &&
      typeof body.specifications === "object" &&
      !Array.isArray(body.specifications)
    ) {
      for (const [k, v] of Object.entries(body.specifications as Record<string, unknown>)) {
        specs[k] = String(v);
      }
    }
    patch.specifications = specs;
  }

  try {
    const product = await updateProduct(id, patch);
    if (!product) {
      return Response.json({ ok: false, error: "محصول یافت نشد" }, { status: 404 });
    }
    return Response.json({ ok: true, data: product });
  } catch {
    return Response.json({ ok: false, error: "خطا در ویرایش محصول" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ ok: false, error: "شناسه محصول نامعتبر است" }, { status: 400 });
  }

  try {
    const removed = await deleteProduct(id);
    if (!removed) {
      return Response.json({ ok: false, error: "محصول یافت نشد" }, { status: 404 });
    }
    return Response.json({ ok: true, data: { id } });
  } catch {
    return Response.json({ ok: false, error: "خطا در حذف محصول" }, { status: 500 });
  }
}
