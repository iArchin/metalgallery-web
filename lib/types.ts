/**
 * Shared domain types — the single source of truth for the web, panel and
 * backend. Collections live as JSON files in /data and are accessed through
 * lib/server/repos.ts.
 */

// ---------------------------------------------------------------- products
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // current sale price (تومان, in thousands like the rest of the site)
  originalPrice?: number; // pre-discount price; discount % is derived
  categoryId: number;
  ageGroup: string; // e.g. "3-8 سال"
  stock: number;
  rating: number; // 0..5
  reviewCount: number;
  /** Local image path (e.g. "/images/products/p1.jpg"). Takes precedence. */
  image?: string;
  /** Admin-uploaded photos, 1..6 paths under /api/uploads/products/. The first
   *  entry is the main photo shown in lists; `image` mirrors it. Empty only
   *  for products created before uploads existed. */
  images: string[];
  imageKeyword: string; // fallback: real-photo search keywords for toyImage()
  imageLock: number; // pinned photo id
  isDeal: boolean; // shown in "پیشنهادات روز"
  isFlashSale: boolean; // shown in "فروش ویژه"
  isTrending: boolean; // shown in "پرطرفدارها"
  active: boolean; // hidden from the shop when false
  specifications: Record<string, string>;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Category {
  id: number;
  name: string;
  imageKeyword: string;
  imageLock: number;
  active: boolean;
  /** Optional category artwork (transparent PNG). Shown as a corner accent on
   *  the home category tiles; falls back to an emoji when empty. */
  image?: string;
}

export interface Brand {
  id: number;
  name: string;
  items: number;
  active: boolean;
  /** Brand logo — a remote URL or a local "/images/..." path. Optional; the
   *  brand marquee falls back to a styled wordmark when it's absent or fails
   *  to load. */
  logo?: string;
}

// ------------------------------------------------------------------ orders
export type OrderStatus =
  | "pending" // در انتظار بررسی
  | "processing" // در حال آماده‌سازی
  | "shipped" // ارسال شده
  | "delivered" // تحویل شده
  | "cancelled"; // لغو شده

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "در انتظار بررسی",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export interface OrderItem {
  productId: number;
  name: string; // snapshot at purchase time
  unitPrice: number; // snapshot
  quantity: number;
  image?: string; // local path snapshot, when the product had one
  imageKeyword: string;
  imageLock: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export interface Order {
  id: number;
  code: string; // human-friendly, e.g. "MG-1043"
  items: OrderItem[];
  customer: OrderCustomer;
  subtotal: number;
  shipping: number; // 0 = free
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------- content
export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string[]; // paragraphs
  date: string; // Persian-formatted display date
  author: string;
  category: string;
  readingMinutes: number;
  imageKeyword: string;
  imageLock: number;
  published: boolean;
}

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  date: string;
  tag: string;
  published: boolean;
}

export interface GalleryItem {
  id: number;
  caption: string;
  imageKeyword: string;
  imageLock: number;
  active: boolean;
}

/** Editable content of the "درباره ما" page. */
export interface AboutContent {
  heroTitle: string;
  heroText: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyImageKeyword: string;
  storyImageLock: number;
  stats: { value: string; label: string }[];
  values: { title: string; text: string }[];
  ctaTitle: string;
  ctaButton: string;
}

// ---------------------------------------------------------------- settings
/** One rotating slide of the home hero carousel (the big banner). */
export interface HeroSlide {
  id: number;
  badgeText: string; // pill label, e.g. "تا ۱۰٪ تخفیف"
  title: string; // headline
  subtitle: string; // supporting line under the title
  ctaText: string; // button label
  ctaHref: string; // button link, e.g. "/products"
  image: string; // local banner image path, e.g. "/images/toy-hero.jpg"
  active: boolean; // hidden from the carousel when false
}

/** How a contact number should be presented — picks its icon and its
 *  schema.org contactType. */
export const PHONE_KINDS = ["landline", "mobile", "whatsapp"] as const;
export type PhoneKind = (typeof PHONE_KINDS)[number];

export const PHONE_KIND_LABELS: Record<PhoneKind, string> = {
  landline: "تلفن ثابت",
  mobile: "تلفن همراه",
  whatsapp: "واتس‌اپ",
};

/** One contact number. A shop can list several (office, mobile, WhatsApp). */
export interface SitePhone {
  id: number;
  label: string; // e.g. "دفتر مرکزی" — optional context, may be empty
  value: string; // e.g. "021-555-82677"
  kind: PhoneKind;
}

/** One branch / postal address. */
export interface SiteAddress {
  id: number;
  label: string; // e.g. "فروشگاه مرکزی"
  value: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  /** Primary number. Mirrors `phones[0].value`, the way `Product.image`
   *  mirrors `images[0]`, so every existing reader keeps working. */
  phone: string;
  email: string;
  /** Primary address. Mirrors `addresses[0].value`. */
  address: string;
  workingHours: string;
  /** Extra contact numbers. ABSENT on settings saved before this field
   *  existed — always read through `sitePhones()`, never directly. */
  phones?: SitePhone[];
  /** Extra addresses. Absent on older settings — read via `siteAddresses()`. */
  addresses?: SiteAddress[];
  /** Hero (home) banner content. The big banner rotates through `heroSlides`;
   *  the `side*` fields drive the smaller card beside it. The `badgeText`/
   *  `title`/`ctaText` fields remain as a fallback slide when `heroSlides`
   *  is empty. */
  hero: {
    badgeText: string; // e.g. "تا ۱۰٪ تخفیف"
    title: string;
    ctaText: string;
    sideTitle: string;
    sideText: string;
    sideCtaText: string;
  };
  /** Rotating slides for the home hero carousel (the big banner). */
  heroSlides: HeroSlide[];
  /** The wide sale campaign band on the home page */
  saleCampaign: {
    enabled: boolean;
    percent: number; // headline off percentage
    title: string; // rendered with {percent}
    pillPercent: number;
    ctaText: string;
  };
  footerAbout: string;
  socials: { facebook: string; twitter: string; linkedin: string; instagram: string };
  /** Free-shipping threshold used by the cart (0 = always free) */
  freeShippingThreshold: number;
  shippingCost: number;
}

/** Iranian mobile numbers start 09 / +989; anything else is treated as a landline. */
export function guessPhoneKind(value: string): PhoneKind {
  const digits = value.replace(/\D/g, "");
  return /^(09|989)/.test(digits) ? "mobile" : "landline";
}

/**
 * The numbers to display, as a list every caller can just map over. Settings
 * saved before `phones` existed carry only the `phone` scalar, so derive a
 * single entry from it rather than rendering nothing.
 */
export function sitePhones(s: Pick<SiteSettings, "phone" | "phones">): SitePhone[] {
  const list = (s.phones ?? []).filter((p) => p?.value?.trim());
  if (list.length > 0) return list;
  const legacy = s.phone?.trim();
  return legacy
    ? [{ id: 1, label: "", value: legacy, kind: guessPhoneKind(legacy) }]
    : [];
}

/** Same fallback rule as `sitePhones`, for addresses. */
export function siteAddresses(
  s: Pick<SiteSettings, "address" | "addresses">
): SiteAddress[] {
  const list = (s.addresses ?? []).filter((a) => a?.value?.trim());
  if (list.length > 0) return list;
  const legacy = s.address?.trim();
  return legacy ? [{ id: 1, label: "", value: legacy }] : [];
}

/**
 * A dialable href. Iranian numbers are normalised to +98 so the link also works
 * from abroad and when saved as a contact; WhatsApp gets a wa.me link instead,
 * which is what tapping a WhatsApp number is expected to do.
 */
export function phoneHref(p: SitePhone): string {
  const raw = p.value.replace(/[^\d+]/g, "");
  const intl = raw.startsWith("+")
    ? raw
    : raw.startsWith("00")
      ? `+${raw.slice(2)}`
      : raw.startsWith("0")
        ? `+98${raw.slice(1)}`
        : `+98${raw}`;
  return p.kind === "whatsapp"
    ? `https://wa.me/${intl.replace(/\D/g, "")}`
    : `tel:${intl}`;
}

// ------------------------------------------------------------- support chat
export interface ChatMessage {
  id: number;
  from: "user" | "admin";
  text: string;
  at: string; // ISO
}

/** One visitor's support conversation. `id` is a token the browser keeps. */
export interface ChatConversation {
  id: string;
  label: string; // visitor display label (phone if logged in, else guest)
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  unreadForAdmin: number; // user messages the admin hasn't opened yet
}

// --------------------------------------------------------------- messages
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ------------------------------------------------------------------- users
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  passwordHash: string; // scrypt: salt:hash (hex) — legacy; login is via SMS OTP
  phone?: string; // canonical 09xxxxxxxxx — the number that receives the admin OTP
  role: "admin";
}

/** A saved delivery address (used on the profile and at checkout). */
export interface CustomerAddress {
  full: string; // complete address text
  postalCode: string; // کد پستی
  lat?: number; // map location
  lng?: number;
}

/** A storefront customer. Identified by phone; created on first OTP login. */
export interface Customer {
  id: number;
  phone: string; // canonical 09xxxxxxxxx
  name: string; // display name (empty until the customer provides one)
  avatar?: string; // profile image URL (optional; falls back to initials)
  address?: CustomerAddress;
  createdAt: string; // ISO
  lastLoginAt: string; // ISO
}

// -------------------------------------------------------------- api shape
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

/** Derived helper — off percentage from price pair. */
export function discountPercent(p: { price: number; originalPrice?: number }): number {
  if (!p.originalPrice || p.originalPrice <= p.price) return 0;
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
}
