import "server-only";

/**
 * Atlas Cloud — the image model behind the panel's "edit image" action.
 *
 * Contract confirmed against the live API and the model's published schema
 * (https://static.atlascloud.ai/model/schema/openai-gpt-image-2-edit.json):
 *
 *   POST {BASE}/model/generateImage
 *     { model, prompt, images: [url], size, quality, output_format }
 *   -> { data: { id, status, urls: { get }, ... } }
 *
 *   GET  <that urls.get>
 *   -> { data: { status, outputs: [url] | null, error } }
 *
 * The job is asynchronous and routinely takes a minute, which is why nothing
 * here waits on it: the panel starts a job, gets an id back, and polls. Holding
 * a request open for that long would hit the proxy's own timeout first.
 *
 * `images` must be a URL Atlas can fetch, so the caller passes an absolute
 * https:// URL of an already-uploaded product photo.
 */

const BASE = (process.env.ATLAS_BASE_URL || "https://api.atlascloud.ai/api/v1").replace(/\/+$/, "");

/** Image-to-image edit model. Overridable without a code change. */
export const ATLAS_EDIT_MODEL = process.env.ATLAS_EDIT_MODEL || "openai/gpt-image-2/edit";

/** Thrown for anything worth showing the admin; the message is Persian. */
export class AtlasError extends Error {}

function apiKey(): string {
  const key = process.env.ATLAS_API_KEY?.trim();
  if (!key) {
    // A missing key is a deployment mistake, not something the admin can fix —
    // say so plainly rather than surfacing a 401 from the provider.
    throw new AtlasError("سرویس ویرایش تصویر پیکربندی نشده است (ATLAS_API_KEY)");
  }
  return key;
}

/** One fetch with a hard timeout — a hung provider must not hang the panel. */
async function call(url: string, init: RequestInit, timeoutMs = 30_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey()}`, ...(init.headers ?? {}) },
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new AtlasError("سرویس ویرایش تصویر پاسخ نداد؛ دوباره تلاش کنید");
    }
    throw new AtlasError("اتصال به سرویس ویرایش تصویر برقرار نشد");
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AtlasError(`پاسخ نامعتبر از سرویس ویرایش تصویر (${res.status})`);
  }

  if (!res.ok) {
    const msg =
      (body as { message?: string; error?: string })?.message ||
      (body as { error?: string })?.error ||
      `خطای ${res.status}`;
    // 401/403 mean the key is wrong or out of credit — both are the operator's
    // problem, so keep the provider's own wording rather than inventing one.
    throw new AtlasError(`سرویس ویرایش تصویر: ${msg}`);
  }
  return body;
}

export interface AtlasJob {
  id: string;
  /** Where to poll. Returned by the API — followed rather than reconstructed,
   *  because the docs and the OpenAPI schema disagree on the path. */
  pollUrl: string;
}

export async function startImageEdit(opts: {
  imageUrl: string;
  prompt: string;
  size?: string;
}): Promise<AtlasJob> {
  const body = await call(`${BASE}/model/generateImage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ATLAS_EDIT_MODEL,
      prompt: opts.prompt,
      images: [opts.imageUrl],
      size: opts.size || "1024x1024",
      quality: "high",
      // JPEG, not PNG. A high-quality 1024px PNG came back at 1.2 MB in
      // testing; the same shot as JPEG is a fraction of that. These become
      // storefront product photos, so the bytes are paid on every page view —
      // and a PNG large enough to pass MAX_UPLOAD_BYTES would fail the save
      // with a size error the admin cannot act on. Product photography has no
      // transparency to preserve.
      output_format: "jpeg",
    }),
  });

  const data = (body as { data?: { id?: string; urls?: { get?: string } } })?.data;
  const id = data?.id;
  const pollUrl = data?.urls?.get;
  if (!id || !pollUrl) {
    throw new AtlasError("سرویس ویرایش تصویر شناسه‌ای برنگرداند");
  }
  return { id, pollUrl };
}

/**
 * The poll URL for a job id.
 *
 * The id is validated hard because it lands in a URL the server then fetches:
 * anything looser here turns this into a request-forgery primitive. The live
 * API returns exactly this path in `urls.get` (the published OpenAPI schema
 * says /model/result/{id} instead — the running service is the authority).
 */
export function pollUrlForJob(id: string): string {
  if (!/^[a-zA-Z0-9]{8,64}$/.test(id)) {
    throw new AtlasError("شناسه ویرایش نامعتبر است");
  }
  return `${BASE}/model/prediction/${id}`;
}

export type AtlasStatus = "processing" | "completed" | "failed";

export interface AtlasResult {
  status: AtlasStatus;
  /** Set only when status is "completed". */
  imageUrl?: string;
  /** Set only when status is "failed". */
  error?: string;
}

export async function getImageEditResult(pollUrl: string): Promise<AtlasResult> {
  const body = await call(pollUrl, { method: "GET" }, 20_000);
  const d = (body as {
    data?: { status?: string; outputs?: string[] | null; error?: string };
  })?.data;

  const status = (d?.status || "").toLowerCase();
  if (status === "failed" || status === "error") {
    return { status: "failed", error: d?.error || "تولید تصویر ناموفق بود" };
  }
  if (status === "completed" || status === "succeeded") {
    const url = d?.outputs?.[0];
    if (!url) {
      // Completed with nothing to show is a provider bug, but the admin still
      // needs a definite end state rather than an endless spinner.
      return { status: "failed", error: "سرویس تصویری برنگرداند" };
    }
    return { status: "completed", imageUrl: url };
  }
  return { status: "processing" };
}
