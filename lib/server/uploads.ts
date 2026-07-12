import "server-only";
import path from "path";
import fs from "fs/promises";
import { randomBytes } from "crypto";

/**
 * Admin-uploaded product photos.
 *
 * Files live under DATA_DIR/uploads/products — the same persistent volume as
 * the legacy JSON (mg_data in production), so uploads survive redeploys. They
 * are served by app/api/uploads/[...path]/route.ts. The /api prefix is load-
 * bearing: on the admin host, next.config.ts rewrites every non-/api path
 * into the panel, and middleware.ts skips /api too — so an /api URL is the
 * one kind that resolves identically on the storefront and the admin host.
 */

export const PRODUCT_IMAGE_LIMIT = 6;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Public URL of a stored product photo, as saved on the product. */
const PRODUCT_UPLOAD_URL = /^\/api\/uploads\/products\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|png|webp)$/;

export function isUploadedProductImage(p: string): boolean {
  return PRODUCT_UPLOAD_URL.test(p);
}

/**
 * Validate a product's `images` payload: 1..6 strings, each an uploaded photo
 * URL (or a legacy /images/ path, so products seeded before uploads can be
 * re-saved). Returns null when invalid.
 */
export function parseProductImages(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.some((s) => typeof s !== "string")) return null;
  const images = (raw as string[]).map((s) => s.trim());
  if (images.length < 1 || images.length > PRODUCT_IMAGE_LIMIT) return null;
  if (!images.every((s) => isUploadedProductImage(s) || s.startsWith("/images/"))) return null;
  return images;
}

export function uploadsRoot(): string {
  return path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "uploads");
}

/** Thrown for anything the admin can fix; the message is shown to them. */
export class UploadError extends Error {}

/**
 * The file's real type, from its first bytes — the browser-supplied name and
 * content type are attacker-controlled and ignored.
 */
function sniffImageExt(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";
  return null;
}

/** Store one uploaded photo; returns its public /api/uploads/... URL. */
export async function saveProductImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("حجم هر تصویر حداکثر ۵ مگابایت است");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageExt(buf);
  if (!ext) {
    throw new UploadError("فرمت تصویر باید JPG، PNG یا WebP باشد");
  }

  const dir = path.join(uploadsRoot(), "products");
  await fs.mkdir(dir, { recursive: true });

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(dir, name), buf);
  return `/api/uploads/products/${name}`;
}
