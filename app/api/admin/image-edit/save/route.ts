import { requireAdminApi } from "@/lib/server/auth";
import { AtlasError, getImageEditResult, pollUrlForJob } from "@/lib/server/atlas";
import { MAX_UPLOAD_BYTES, UploadError, saveProductImageBuffer } from "@/lib/server/uploads";

/**
 * Adopt a finished edit as a real product photo.
 *
 * Takes the job id — never a URL from the browser. The provider's result lives
 * on its own CDN behind a signed path that will expire, so it has to be copied
 * into our uploads volume anyway; asking the provider for the URL again, rather
 * than accepting whatever the client posts, means this route can only ever
 * fetch something the provider itself produced.
 */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  let pollUrl: string;
  try {
    pollUrl = pollUrlForJob(id);
  } catch {
    return Response.json({ ok: false, error: "شناسه نامعتبر است" }, { status: 400 });
  }

  try {
    const result = await getImageEditResult(pollUrl);
    if (result.status !== "completed" || !result.imageUrl) {
      return Response.json(
        { ok: false, error: "این ویرایش هنوز آماده نیست" },
        { status: 409 }
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    let res: Response;
    try {
      res = await fetch(result.imageUrl, { signal: controller.signal, cache: "no-store" });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      return Response.json({ ok: false, error: "دریافت تصویر ساخته‌شده ناموفق بود" }, { status: 502 });
    }

    // Guard before buffering: a Content-Length past the cap means there is no
    // point reading the body at all.
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES) {
      return Response.json({ ok: false, error: "تصویر ساخته‌شده بیش از حد بزرگ است" }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const url = await saveProductImageBuffer(buf);
    return Response.json({ ok: true, data: url });
  } catch (e) {
    if (e instanceof UploadError || e instanceof AtlasError) {
      return Response.json({ ok: false, error: e.message }, { status: 400 });
    }
    return Response.json({ ok: false, error: "خطا در ذخیره تصویر ساخته‌شده" }, { status: 500 });
  }
}
