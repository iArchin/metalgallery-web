import { listProducts, createProduct, type ProductInput } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const wantsAll = url.searchParams.get("all") === "1";
    let includeInactive = false;
    if (wantsAll) {
      const denied = await requireAdminApi();
      if (!denied) includeInactive = true;
    }
    const products = await listProducts(includeInactive ? { includeInactive: true } : undefined);
    return Response.json({ ok: true, data: products });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت فهرست محصولات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  const categoryId = Number(body.categoryId);
  const stock = Number(body.stock);
  const imageKeyword = typeof body.imageKeyword === "string" ? body.imageKeyword.trim() : "";
  const imageLock = Number(body.imageLock);

  if (!name) {
    return Response.json({ ok: false, error: "نام محصول الزامی است" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return Response.json({ ok: false, error: "قیمت محصول نامعتبر است" }, { status: 400 });
  }
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return Response.json({ ok: false, error: "دسته‌بندی محصول نامعتبر است" }, { status: 400 });
  }
  if (!Number.isFinite(stock) || stock < 0) {
    return Response.json({ ok: false, error: "موجودی محصول نامعتبر است" }, { status: 400 });
  }
  if (!imageKeyword) {
    return Response.json({ ok: false, error: "کلیدواژه تصویر الزامی است" }, { status: 400 });
  }
  if (!Number.isFinite(imageLock)) {
    return Response.json({ ok: false, error: "شناسه تصویر نامعتبر است" }, { status: 400 });
  }

  const originalPriceRaw = body.originalPrice;
  let originalPrice: number | undefined;
  if (originalPriceRaw !== undefined && originalPriceRaw !== null && originalPriceRaw !== "") {
    const n = Number(originalPriceRaw);
    if (!Number.isFinite(n) || n <= 0) {
      return Response.json({ ok: false, error: "قیمت قبل از تخفیف نامعتبر است" }, { status: 400 });
    }
    originalPrice = n;
  }

  const specifications: Record<string, string> = {};
  if (body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)) {
    for (const [k, v] of Object.entries(body.specifications as Record<string, unknown>)) {
      specifications[k] = String(v);
    }
  }

  let image: string | undefined;
  if (typeof body.image === "string" && body.image) {
    if (!body.image.startsWith("/images/")) {
      return Response.json({ ok: false, error: "آدرس تصویر نامعتبر است" }, { status: 400 });
    }
    image = body.image;
  }

  // rating / reviewCount come from the create form; default 5 / 0 when absent
  let rating = 5;
  if (body.rating !== undefined) {
    const n = Number(body.rating);
    if (!Number.isFinite(n) || n < 0) {
      return Response.json({ ok: false, error: "امتیاز محصول نامعتبر است" }, { status: 400 });
    }
    rating = Math.min(5, Math.floor(n));
  }
  let reviewCount = 0;
  if (body.reviewCount !== undefined) {
    const n = Number(body.reviewCount);
    if (!Number.isFinite(n) || n < 0) {
      return Response.json({ ok: false, error: "تعداد نظرات نامعتبر است" }, { status: 400 });
    }
    reviewCount = Math.floor(n);
  }

  const input: ProductInput = {
    name,
    description: typeof body.description === "string" ? body.description : "",
    price: Math.floor(price),
    originalPrice: originalPrice !== undefined ? Math.floor(originalPrice) : undefined,
    categoryId: Math.floor(categoryId),
    ageGroup: typeof body.ageGroup === "string" ? body.ageGroup : "",
    stock: Math.floor(stock),
    rating,
    reviewCount,
    image,
    imageKeyword,
    imageLock: Math.floor(imageLock),
    isDeal: body.isDeal === true,
    isFlashSale: body.isFlashSale === true,
    isTrending: body.isTrending === true,
    active: body.active === undefined ? true : body.active === true,
    specifications,
  };

  try {
    const product = await createProduct(input);
    return Response.json({ ok: true, data: product });
  } catch {
    return Response.json({ ok: false, error: "خطا در ایجاد محصول" }, { status: 500 });
  }
}
