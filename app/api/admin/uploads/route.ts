import { requireAdminApi } from "@/lib/server/auth";
import {
  saveProductImage,
  UploadError,
  PRODUCT_IMAGE_LIMIT,
} from "@/lib/server/uploads";

/**
 * Store product photos sent by the panel as multipart form data ("files"
 * entries). Returns the public URLs, which the panel then submits on the
 * product itself. Files whose product is never saved are orphaned on disk;
 * harmless at this shop's scale.
 */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return Response.json({ ok: false, error: "تصویری دریافت نشد" }, { status: 400 });
  }
  if (files.length > PRODUCT_IMAGE_LIMIT) {
    return Response.json(
      { ok: false, error: "حداکثر ۶ تصویر می‌توانید بارگذاری کنید" },
      { status: 400 }
    );
  }

  try {
    const urls: string[] = [];
    for (const file of files) {
      urls.push(await saveProductImage(file));
    }
    return Response.json({ ok: true, data: urls });
  } catch (err) {
    if (err instanceof UploadError) {
      return Response.json({ ok: false, error: err.message }, { status: 400 });
    }
    return Response.json({ ok: false, error: "خطا در ذخیره تصویر" }, { status: 500 });
  }
}
