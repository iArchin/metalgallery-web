import { requireAdminApi } from "@/lib/server/auth";
import { AtlasError, startImageEdit } from "@/lib/server/atlas";
import {
  IMAGE_PRESETS,
  buildImagePrompt,
  type ImagePreset,
} from "@/lib/server/image-prompts";
import { isUploadedProductImage } from "@/lib/server/uploads";

/**
 * Start an AI edit of an already-uploaded product photo.
 *
 * Returns a job id; the panel polls ./[id] for the result. The job routinely
 * takes a minute, so nothing is awaited here — holding the request open would
 * hit the edge proxy's timeout long before the provider answered.
 */

/** The provider fetches the source image over the internet, so it needs an
 *  absolute URL. Prefer the canonical site; fall back to the host we were
 *  called on, which is public for both the shop and the admin subdomain. */
function absoluteImageUrl(path: string, req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return `${configured}${path}`;
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}${path}`;
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

  const image = typeof body.image === "string" ? body.image.trim() : "";
  // Only our own stored uploads. Without this the field is a request forgery
  // primitive: any URL here would be fetched and echoed by the provider.
  if (!isUploadedProductImage(image)) {
    return Response.json(
      { ok: false, error: "فقط تصویرهای بارگذاری‌شده همین محصول قابل ویرایش هستند" },
      { status: 400 }
    );
  }

  const preset = String(body.preset ?? "") as ImagePreset;
  if (!IMAGE_PRESETS.includes(preset)) {
    return Response.json({ ok: false, error: "نوع ویرایش نامعتبر است" }, { status: 400 });
  }

  // The admin's own note. Capped so a paste cannot balloon the request.
  const extra = typeof body.extra === "string" ? body.extra.trim().slice(0, 600) : "";

  const name = typeof body.name === "string" ? body.name.slice(0, 200) : undefined;
  const specifications =
    body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)
      ? (body.specifications as Record<string, string>)
      : undefined;

  const prompt = buildImagePrompt(preset, { name, specifications }, extra);

  try {
    const job = await startImageEdit({ imageUrl: absoluteImageUrl(image, req), prompt });
    return Response.json({ ok: true, data: { id: job.id } });
  } catch (e) {
    if (e instanceof AtlasError) {
      return Response.json({ ok: false, error: e.message }, { status: 502 });
    }
    return Response.json({ ok: false, error: "خطا در شروع ویرایش تصویر" }, { status: 500 });
  }
}
