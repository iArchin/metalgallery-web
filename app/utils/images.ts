/**
 * Real toy / action-figure imagery sourced from the internet.
 *
 * We use LoremFlickr, which returns real Creative-Commons Flickr photos that
 * match the given keywords (e.g. "toy", "action figure", "teddy bear"). The
 * `lock` id pins a specific photo so the same product always shows the same
 * image instead of changing on every reload.
 *
 * Usage in a plain <img> (no next/image domain config needed):
 *   <img src={toyImage("teddy bear", 21)} alt="..." className="w-full h-full object-cover" />
 */
export function toyImage(
  keywords: string,
  lock: number,
  width = 600,
  height = 600
): string {
  const kw = keywords.trim().replace(/\s+/g, ",");
  return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(
    kw
  )}?lock=${lock}`;
}

/** Wide banner variant (16:9-ish) for hero / promo strips. */
export function toyBanner(keywords: string, lock: number): string {
  return toyImage(keywords, lock, 900, 600);
}

/**
 * Curated keyword + lock presets. Import these so imagery stays consistent and
 * genuinely toy-themed across the site. Each entry is a distinct pinned photo.
 */
export const TOY_PHOTOS = {
  actionFigure: { kw: "action figure", lock: 11 },
  superheroFigure: { kw: "superhero,action,figure", lock: 12 },
  robotToy: { kw: "robot,toy", lock: 13 },
  teddyBear: { kw: "teddy bear", lock: 21 },
  plushPanda: { kw: "panda,plush,toy", lock: 22 },
  plushDino: { kw: "dinosaur,plush,toy", lock: 23 },
  buildingBlocks: { kw: "lego,building,blocks", lock: 31 },
  woodenToy: { kw: "wooden,toy", lock: 32 },
  puzzle: { kw: "jigsaw,puzzle,toy", lock: 33 },
  toyTruck: { kw: "toy,truck", lock: 41 },
  toyCar: { kw: "toy,car", lock: 42 },
  rcCar: { kw: "remote,control,car,toy", lock: 43 },
  rockingHorse: { kw: "rocking,horse,toy", lock: 51 },
  musicToy: { kw: "kids,musical,toy", lock: 52 },
  ballPit: { kw: "kids,ball,toy", lock: 53 },
  boardGame: { kw: "board,game,toy", lock: 61 },
  dollhouse: { kw: "dollhouse,toy", lock: 62 },
  rubberDuck: { kw: "rubber,duck,toy", lock: 63 },
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
