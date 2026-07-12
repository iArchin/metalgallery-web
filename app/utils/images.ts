/**
 * Toy / action-figure imagery sourced from Unsplash.
 *
 * Each preset maps to a curated Unsplash photo that matches the theme.
 * The `lock` parameter picks a variant within the same keyword group so the
 * same product always shows a consistent image.
 *
 * Unsplash URL format:
 *   https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop
 */

/* ---- Curated Unsplash photo IDs for toy categories ---- */
const TOY_PHOTO_IDS: Record<string, string[]> = {
  "teddy bear":     ["1559458", "1560422", "1587931"],
  "action figure":  ["1567196", "1593571", "1630364"],
  "toy car":        ["1587654", "3672903", "1535680"],
  "building blocks":["1593529", "1567834", "1535680"],
  puzzle:           ["1578272", "1613480", "1567086"],
  doll:             ["1535680", "1559458", "1593571"],
  robot:            ["1567196", "1630364", "3672903"],
  boardgame:        ["1613480", "1578272", "1567086"],
  plush:            ["1559458", "1587931", "1560422"],
  wooden:           ["1567834", "1593529", "1613480"],
};

/** Fallback generic toy IDs */
const GENERIC_TOY_IDS = ["1567196", "1559458", "1587654", "3672903", "1535680", "1593571"];

/**
 * Local toy photos served from /public. Remote stock services (Unsplash, etc.)
 * are unreliable / blocked in-region, so all keyword-based imagery resolves to
 * one of these instead — guaranteeing pictures load everywhere.
 */
const LOCAL_TOY_IMAGES = [
  "/images/toy-kids-1.jpg",
  "/images/toy-kids-2.jpg",
  "/images/toy-kids-3.jpg",
  "/images/toy-kids-4.jpg",
  "/images/toy-kids-5.jpg",
  "/images/toy-banner.jpg",
  "/images/toy-promo.jpg",
  "/images/toy-hero.jpg",
] as const;

/**
 * Resolve keywords + lock to a local toy photo. `lock` is stable per item, so
 * each product/article/category keeps a consistent image. (Width/height are
 * accepted for call-site compatibility but no longer needed.)
 */
export function toyImage(
  keywords: string,
  lock: number,
  _width = 600,
  _height = 600
): string {
  void keywords;
  void _width;
  void _height;
  const idx = Math.abs(Math.trunc(lock || 0)) % LOCAL_TOY_IMAGES.length;
  return LOCAL_TOY_IMAGES[idx];
}

/** Wide banner variant (16:9-ish) for hero / promo strips. */
export function toyBanner(keywords: string, lock: number): string {
  return toyImage(keywords, lock, 900, 600);
}

/**
 * Curated keyword + presets. Import these so imagery stays consistent and
 * genuinely toy-themed across the site. Each entry is a distinct photo.
 */
export const TOY_PHOTOS = {
  actionFigure:     { kw: "action figure",    lock: 11 },
  superheroFigure:  { kw: "superhero action figure", lock: 12 },
  robotToy:         { kw: "robot toy",        lock: 13 },
  teddyBear:        { kw: "teddy bear",       lock: 21 },
  plushPanda:       { kw: "panda plush toy",  lock: 22 },
  plushDino:        { kw: "dinosaur plush toy", lock: 23 },
  buildingBlocks:   { kw: "building blocks",  lock: 31 },
  woodenToy:        { kw: "wooden toy",       lock: 32 },
  puzzle:           { kw: "puzzle toy",       lock: 33 },
  toyTruck:         { kw: "toy truck",        lock: 41 },
  toyCar:           { kw: "toy car",          lock: 42 },
  rcCar:            { kw: "remote control car toy", lock: 43 },
  rockingHorse:     { kw: "rocking horse toy", lock: 51 },
  musicToy:         { kw: "musical toy",      lock: 52 },
  ballPit:          { kw: "ball toy",         lock: 53 },
  boardGame:        { kw: "board game",       lock: 61 },
  dollhouse:        { kw: "doll",             lock: 62 },
  rubberDuck:       { kw: "duck toy",         lock: 63 },
} as const;

export type ToyPhotoKey = keyof typeof TOY_PHOTOS;

/** Convenience: resolve a preset key straight to a URL. */
export function presetImage(
  key: ToyPhotoKey,
  width = 600,
  height = 600
): string {
  const p = TOY_PHOTOS[key];
  return toyImage(p.kw, p.lock, width, height);
}

/* -------------------------------------------------------- product images */

/** The shop's own product photos, served from /public. */
export const PRODUCT_IMAGES = [
  "/images/products/p1.jpg",
  "/images/products/p2.jpg",
  "/images/products/p3.jpg",
  "/images/products/p4.jpg",
  "/images/products/p5.jpg",
] as const;

/**
 * Resolve the display image for anything product-shaped (products, cart
 * items, order lines). The first uploaded photo wins, then a local `image`
 * path; otherwise fall back to the keyword toy photo (products that predate
 * uploads).
 */
export function productImage(
  p: { image?: string; images?: string[]; imageKeyword: string; imageLock: number },
  width = 600,
  height = 600
): string {
  return p.images?.[0] || p.image || toyImage(p.imageKeyword, p.imageLock, width, height);
}
