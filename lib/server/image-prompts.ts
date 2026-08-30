import "server-only";

/**
 * Prompts for the panel's "edit image" action.
 *
 * These are written for catalogue photography, so every one of them leads with
 * the same non-negotiable: the product must come back unchanged. An image model
 * asked to "put this toy in a hand" will happily redesign the toy on the way,
 * and a listing photo that misrepresents the item is worse than no photo — it
 * is a return, or a complaint. The preservation clause is therefore repeated
 * per preset rather than assumed.
 */

export const IMAGE_PRESETS = [
  "held-in-hand",
  "on-back-of-hand",
  "white-bg",
  "lifestyle",
] as const;
export type ImagePreset = (typeof IMAGE_PRESETS)[number];

export const PRESET_LABELS: Record<ImagePreset, string> = {
  "held-in-hand": "گرفته‌شده در یک دست",
  "on-back-of-hand": "روی پشت دست",
  "white-bg": "پس‌زمینه سفید",
  lifestyle: "در محیط واقعی",
};

/** Applies to every preset — the product itself is never up for reinterpretation. */
const FIDELITY = [
  "CRITICAL: reproduce the product from the reference image exactly as it is.",
  "Do not redesign, restyle, or re-proportion it.",
  "Preserve its exact shape, silhouette, colours, materials, surface finish, paint application, panel lines, sculpted detail, joints and accessories.",
  "Preserve any printed logos, brand marks, text and packaging graphics character for character; never invent, translate or re-letter them.",
  "Do not add, remove, or substitute any part of the product.",
  "The result must be recognisable as the same physical item a customer will receive.",
].join(" ");

/** Applies to every preset — output hygiene for a product listing. */
const OUTPUT_RULES = [
  "Photorealistic commercial product photography.",
  "Sharp focus on the product, high micro-detail, clean and natural colour.",
  "No watermarks, no signatures, no text overlays, no logos of any kind added to the scene.",
  "No collage, no split frames, no borders, no drop shadows outside the scene.",
  "A single product, shown once, fully inside the frame with comfortable margins and nothing cropped at the edges.",
].join(" ");

/**
 * Shared by both hand shots. A single hand and a white background are fixed
 * here rather than left to the model: two hands read as a person presenting the
 * item instead of a scale reference, and any background at all makes the shot
 * unusable next to the white-background photos in the same listing grid.
 */
const HAND_RULES = [
  "Exactly ONE adult hand — a single hand only. Never two hands, never a second hand entering the frame.",
  "The hand is bare, natural and well-groomed, with realistic skin texture and neutral short nails; no jewellery, no nail polish, no tattoos, no watch, no sleeve cuff.",
  "Show the hand and at most the wrist — no face, no arm past the wrist, no torso, no other body part.",
  "PURE WHITE seamless background (#FFFFFF), uniform edge to edge behind both the hand and the product; no room, no furniture, no surface texture, no gradient, no vignette.",
  "Bright, soft, even studio lighting; a gentle natural shadow under the hand only, never a dark or dramatic one.",
  "The point of the shot is to let a shopper judge the product's real size, so the relationship between hand and product must be believable.",
].join(" ");

const PRESET_BODY: Record<ImagePreset, string> = {
  "held-in-hand":
    [
      "Show this product held in one hand, photographed for an online shop listing.",
      "The fingers grip the product naturally, in a way that suits its real weight and balance.",
      "Turn it so its front — its most recognisable side — faces the camera and stays fully visible; fingers must not cover the product's face, any important sculpted detail, or any printed text.",
      HAND_RULES,
    ].join(" "),
  "on-back-of-hand":
    [
      "Show this product resting on the BACK of one open hand, photographed for an online shop listing.",
      "The hand is held out flat and level, palm facing down, fingers relaxed and together, so the product sits balanced on the flat upper surface of the hand.",
      "The product is placed on the hand, not gripped: no fingers curl around it and nothing holds it in place.",
      "Shoot slightly above eye level looking down at the back of the hand so both the hand's surface and the whole product are clearly visible, with the product's front turned toward the camera.",
      HAND_RULES,
    ].join(" "),
  "white-bg":
    [
      "Place this product on a pure white seamless studio background (#FFFFFF), photographed for an online shop listing.",
      "Centre it, shot straight on at a natural eye-level product angle, filling most of the frame while keeping clear even margins.",
      "Bright, soft, even three-point studio lighting with no harsh highlights and no colour cast.",
      "A subtle, soft contact shadow directly beneath the product so it sits on the surface rather than floating; no long or dramatic shadows.",
      "Remove every background element, prop, hand, surface texture and distraction from the original photo, leaving only the product.",
      "The background must be uniformly white edge to edge, suitable for a marketplace listing.",
    ].join(" "),
  lifestyle:
    [
      "Place this product in a tasteful real-world setting appropriate to it, photographed for an online shop listing.",
      "A clean, uncluttered, softly out-of-focus domestic or shelf environment in warm neutral tones; the product is unmistakably the subject.",
      "Natural soft daylight, gentle realistic shadows, shallow depth of field.",
      "No people, no other branded products, no text or signage in the scene.",
    ].join(" "),
};

/** Everything known about the item that helps the model get scale right. */
export interface ProductContext {
  name?: string;
  /** Free-form spec pairs from the panel; dimension-like ones are picked out. */
  specifications?: Record<string, string>;
  ageGroup?: string;
}

/**
 * Pull anything dimension-shaped out of the product's specs.
 *
 * Scale is the thing these models get wrong most often — a 6cm figure rendered
 * filling an adult palm reads as a 30cm statue, which is exactly the kind of
 * misleading listing photo that causes returns. Specs are free text typed by
 * the admin, so match on the words they actually use rather than a fixed key.
 */
function dimensionHints(specs?: Record<string, string>): string[] {
  if (!specs) return [];
  const KEYS = ["ابعاد", "اندازه", "سایز", "قد", "ارتفاع", "طول", "عرض", "وزن", "size", "dimension", "height", "length", "width", "weight"];
  return Object.entries(specs)
    .filter(([k]) => KEYS.some((w) => k.toLowerCase().includes(w)))
    .map(([k, v]) => `${k}: ${v}`)
    .filter((s) => s.length < 120);
}

/**
 * Build the final prompt.
 *
 * `extra` is the admin's own words, appended last and introduced as an explicit
 * instruction so it reads as a refinement rather than as competing narration.
 * The fidelity clause stays ahead of it: a free-text note should be able to
 * change the scene, never to license redrawing the product.
 */
export function buildImagePrompt(
  preset: ImagePreset,
  product: ProductContext = {},
  extra?: string
): string {
  const parts: string[] = [PRESET_BODY[preset], FIDELITY, OUTPUT_RULES];

  if (product.name?.trim()) {
    parts.push(`The product is: ${product.name.trim()}.`);
  }

  const dims = dimensionHints(product.specifications);
  if (dims.length > 0) {
    parts.push(
      `Real measurements of the product: ${dims.join("; ")}. ` +
        "Render it at exactly this real-world scale relative to everything else in the frame — " +
        "a viewer must be able to judge its true size from the photograph."
    );
  } else if (preset === "held-in-hand" || preset === "on-back-of-hand") {
    // No measurements on file: say so, rather than letting the model default to
    // a flattering (and misleading) size.
    parts.push(
      "Judge the product's size from the reference photograph and keep it consistent and believable against the hand; do not exaggerate its scale."
    );
  }

  const note = extra?.trim();
  if (note) {
    parts.push(
      `Additional art direction from the shop owner, to be followed as long as it does not alter the product itself: ${note}`
    );
  }

  return parts.join("\n\n");
}
