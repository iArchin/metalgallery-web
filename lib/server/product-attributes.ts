import "server-only";

/**
 * Parsing for the catalogue attributes — brand, scale, size, material, colour.
 *
 * Shared by POST /api/products and PUT /api/products/[id] so the two cannot
 * drift: a value the create route accepts must be exactly a value the update
 * route accepts, or a product becomes uneditable after it is made.
 */

/** Longest sensible product dimension, in cm. Guards a typo, not an attack. */
const MAX_SIZE_CM = 500;
const MAX_TEXT = 120;

export interface ProductAttributes {
  brandId?: number;
  scale?: string;
  sizeCm?: number;
  material?: string;
  color?: string;
}

function text(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, MAX_TEXT) : "";
}

/**
 * `undefined` means "not mentioned, leave it alone"; an empty string or null
 * means "clear it". That distinction is what lets PATCH-style updates work
 * without wiping fields the form did not send.
 */
export function parseProductAttributes(
  body: Record<string, unknown>,
  { partial }: { partial: boolean }
): ProductAttributes | { error: string } {
  const out: ProductAttributes = {};

  if (!partial || body.brandId !== undefined) {
    const raw = body.brandId;
    if (raw === null || raw === "" || raw === undefined) {
      out.brandId = undefined;
    } else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) return { error: "برند انتخاب‌شده نامعتبر است" };
      out.brandId = n;
    }
  }

  if (!partial || body.sizeCm !== undefined) {
    const raw = body.sizeCm;
    if (raw === null || raw === "" || raw === undefined) {
      out.sizeCm = undefined;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0 || n > MAX_SIZE_CM) {
        // Persian digits throughout — interpolating MAX_SIZE_CM produced
        // "بین ۱ تا 500", mixing numerals mid-sentence.
        return { error: "اندازه باید عددی بین ۱ تا ۵۰۰ سانتی‌متر باشد" };
      }
      out.sizeCm = n;
    }
  }

  if (!partial || body.scale !== undefined) out.scale = text(body.scale);
  if (!partial || body.material !== undefined) out.material = text(body.material);
  if (!partial || body.color !== undefined) out.color = text(body.color);

  return out;
}
