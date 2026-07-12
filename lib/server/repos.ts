import "server-only";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  products as productsT,
  categories as categoriesT,
  brands as brandsT,
  orders as ordersT,
  orderItems as orderItemsT,
  articles as articlesT,
  news as newsT,
  gallery as galleryT,
  messages as messagesT,
  settings as settingsT,
  pages as pagesT,
} from "./schema";
import type {
  AboutContent,
  Article,
  Brand,
  Category,
  ContactMessage,
  GalleryItem,
  NewsItem,
  Order,
  OrderCustomer,
  OrderItem,
  OrderStatus,
  Product,
  SiteSettings,
} from "../types";

/* ---------------------------------------------------------------- mappers */
// Drizzle rows use `null` for absent optional columns and Date for timestamps;
// the domain types use `undefined` and ISO strings. These convert at the edge.

type ProductRow = typeof productsT.$inferSelect;
function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    categoryId: r.categoryId,
    ageGroup: r.ageGroup,
    stock: r.stock,
    rating: r.rating,
    reviewCount: r.reviewCount,
    image: r.image ?? undefined,
    images: r.images ?? [],
    imageKeyword: r.imageKeyword,
    imageLock: r.imageLock,
    isDeal: r.isDeal,
    isFlashSale: r.isFlashSale,
    isTrending: r.isTrending,
    active: r.active,
    specifications: r.specifications,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

type OrderRow = typeof ordersT.$inferSelect;
type OrderItemRow = typeof orderItemsT.$inferSelect;
function toOrderItem(r: OrderItemRow): OrderItem {
  return {
    productId: r.productId,
    name: r.name,
    unitPrice: r.unitPrice,
    quantity: r.quantity,
    image: r.image ?? undefined,
    imageKeyword: r.imageKeyword,
    imageLock: r.imageLock,
  };
}
function toOrder(r: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: r.id,
    code: r.code,
    items: items.map(toOrderItem),
    customer: {
      name: r.customerName,
      phone: r.customerPhone,
      address: r.customerAddress,
      note: r.customerNote ?? undefined,
    },
    subtotal: r.subtotal,
    shipping: r.shipping,
    total: r.total,
    status: r.status as OrderStatus,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/* ------------------------------------------------------------- products */

export async function listProducts(opts?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const rows = opts?.includeInactive
    ? await db.select().from(productsT).orderBy(productsT.id)
    : await db.select().from(productsT).where(eq(productsT.active, true)).orderBy(productsT.id);
  return rows.map(toProduct);
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const [row] = await db.select().from(productsT).where(eq(productsT.id, id));
  return row ? toProduct(row) : undefined;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

function productValues(input: Partial<ProductInput>) {
  // Convert domain optionals (undefined) to what Drizzle expects; only the keys
  // present in `input` are set (Partial), so patches don't clobber other fields.
  const v: Record<string, unknown> = { ...input };
  if ("originalPrice" in input) v.originalPrice = input.originalPrice ?? null;
  if ("image" in input) v.image = input.image ?? null;
  return v;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const [row] = await db
    .insert(productsT)
    .values(productValues(input) as typeof productsT.$inferInsert)
    .returning();
  return toProduct(row);
}

export async function updateProduct(
  id: number,
  patch: Partial<ProductInput>
): Promise<Product | undefined> {
  const [row] = await db
    .update(productsT)
    .set({ ...productValues(patch), updatedAt: new Date() })
    .where(eq(productsT.id, id))
    .returning();
  return row ? toProduct(row) : undefined;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const rows = await db.delete(productsT).where(eq(productsT.id, id)).returning({ id: productsT.id });
  return rows.length > 0;
}

/* ----------------------------------------------------- simple collections */

export const categoriesRepo = {
  list: async (): Promise<Category[]> =>
    (await db.select().from(categoriesT).orderBy(categoriesT.id)).map((r) => ({
      ...r,
      image: r.image ?? undefined,
    })),
  get: async (id: number): Promise<Category | undefined> => {
    const [r] = await db.select().from(categoriesT).where(eq(categoriesT.id, id));
    return r ? { ...r, image: r.image ?? undefined } : undefined;
  },
  create: async (input: Omit<Category, "id">): Promise<Category> => {
    const [r] = await db
      .insert(categoriesT)
      .values({ ...input, image: input.image ?? null })
      .returning();
    return { ...r, image: r.image ?? undefined };
  },
  update: async (id: number, patch: Partial<Omit<Category, "id">>): Promise<Category | undefined> => {
    const v: Record<string, unknown> = { ...patch };
    if ("image" in patch) v.image = patch.image ?? null;
    const [r] = await db.update(categoriesT).set(v).where(eq(categoriesT.id, id)).returning();
    return r ? { ...r, image: r.image ?? undefined } : undefined;
  },
  remove: async (id: number): Promise<boolean> =>
    (await db.delete(categoriesT).where(eq(categoriesT.id, id)).returning({ id: categoriesT.id })).length > 0,
};

export const brandsRepo = {
  list: async (): Promise<Brand[]> =>
    (await db.select().from(brandsT).orderBy(brandsT.id)).map((r) => ({ ...r, logo: r.logo ?? undefined })),
  get: async (id: number): Promise<Brand | undefined> => {
    const [r] = await db.select().from(brandsT).where(eq(brandsT.id, id));
    return r ? { ...r, logo: r.logo ?? undefined } : undefined;
  },
  create: async (input: Omit<Brand, "id">): Promise<Brand> => {
    const [r] = await db.insert(brandsT).values({ ...input, logo: input.logo ?? null }).returning();
    return { ...r, logo: r.logo ?? undefined };
  },
  update: async (id: number, patch: Partial<Omit<Brand, "id">>): Promise<Brand | undefined> => {
    const v: Record<string, unknown> = { ...patch };
    if ("logo" in patch) v.logo = patch.logo ?? null;
    const [r] = await db.update(brandsT).set(v).where(eq(brandsT.id, id)).returning();
    return r ? { ...r, logo: r.logo ?? undefined } : undefined;
  },
  remove: async (id: number): Promise<boolean> =>
    (await db.delete(brandsT).where(eq(brandsT.id, id)).returning({ id: brandsT.id })).length > 0,
};

// articles, news, gallery have no optional/date fields — the row shape matches
// the domain type directly.
export const articlesRepo = {
  list: (): Promise<Article[]> => db.select().from(articlesT).orderBy(desc(articlesT.id)),
  get: async (id: number): Promise<Article | undefined> =>
    (await db.select().from(articlesT).where(eq(articlesT.id, id)))[0],
  create: async (input: Omit<Article, "id">): Promise<Article> =>
    (await db.insert(articlesT).values(input).returning())[0],
  update: async (id: number, patch: Partial<Omit<Article, "id">>): Promise<Article | undefined> =>
    (await db.update(articlesT).set(patch).where(eq(articlesT.id, id)).returning())[0],
  remove: async (id: number): Promise<boolean> =>
    (await db.delete(articlesT).where(eq(articlesT.id, id)).returning({ id: articlesT.id })).length > 0,
};

export const newsRepo = {
  list: (): Promise<NewsItem[]> => db.select().from(newsT).orderBy(desc(newsT.id)),
  get: async (id: number): Promise<NewsItem | undefined> =>
    (await db.select().from(newsT).where(eq(newsT.id, id)))[0],
  create: async (input: Omit<NewsItem, "id">): Promise<NewsItem> =>
    (await db.insert(newsT).values(input).returning())[0],
  update: async (id: number, patch: Partial<Omit<NewsItem, "id">>): Promise<NewsItem | undefined> =>
    (await db.update(newsT).set(patch).where(eq(newsT.id, id)).returning())[0],
  remove: async (id: number): Promise<boolean> =>
    (await db.delete(newsT).where(eq(newsT.id, id)).returning({ id: newsT.id })).length > 0,
};

export const galleryRepo = {
  list: (): Promise<GalleryItem[]> => db.select().from(galleryT).orderBy(galleryT.id),
  get: async (id: number): Promise<GalleryItem | undefined> =>
    (await db.select().from(galleryT).where(eq(galleryT.id, id)))[0],
  create: async (input: Omit<GalleryItem, "id">): Promise<GalleryItem> =>
    (await db.insert(galleryT).values(input).returning())[0],
  update: async (id: number, patch: Partial<Omit<GalleryItem, "id">>): Promise<GalleryItem | undefined> =>
    (await db.update(galleryT).set(patch).where(eq(galleryT.id, id)).returning())[0],
  remove: async (id: number): Promise<boolean> =>
    (await db.delete(galleryT).where(eq(galleryT.id, id)).returning({ id: galleryT.id })).length > 0,
};

/* --------------------------------------------------------------- orders */

async function attachItems(rows: OrderRow[]): Promise<Order[]> {
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(orderItemsT)
    .where(inArray(orderItemsT.orderId, rows.map((r) => r.id)));
  const byOrder = new Map<number, OrderItemRow[]>();
  for (const it of items) {
    const list = byOrder.get(it.orderId);
    if (list) list.push(it);
    else byOrder.set(it.orderId, [it]);
  }
  return rows.map((r) => toOrder(r, byOrder.get(r.id) ?? []));
}

export async function listOrders(): Promise<Order[]> {
  return attachItems(await db.select().from(ordersT).orderBy(desc(ordersT.createdAt)));
}

export async function getOrder(id: number): Promise<Order | undefined> {
  const [row] = await db.select().from(ordersT).where(eq(ordersT.id, id));
  if (!row) return undefined;
  return (await attachItems([row]))[0];
}

export async function listOrdersByPhone(phone: string): Promise<Order[]> {
  return attachItems(
    await db.select().from(ordersT).where(eq(ordersT.customerPhone, phone)).orderBy(desc(ordersT.createdAt))
  );
}

/** Thrown inside placeOrder's transaction to roll back with a user message. */
class OrderError extends Error {}

/**
 * Checkout, in one transaction: locks each product row (FOR UPDATE) so stock
 * can't oversell under concurrency, snapshots names + authoritative prices,
 * decrements stock, and records the order and its items. Any failure rolls the
 * whole thing back.
 */
export async function placeOrder(input: {
  items: { productId: number; quantity: number }[];
  customer: OrderCustomer;
}): Promise<{ order?: Order; error?: string }> {
  if (!input.items.length) return { error: "سبد خرید خالی است" };
  if (!input.customer.name?.trim() || !input.customer.phone?.trim() || !input.customer.address?.trim()) {
    return { error: "نام، تلفن و آدرس الزامی است" };
  }

  const settings = await getSettings();

  try {
    const order = await db.transaction(async (tx) => {
      const lines: OrderItem[] = [];
      for (const item of input.items) {
        const qty = Math.max(1, Math.floor(item.quantity));
        const [p] = await tx
          .select()
          .from(productsT)
          .where(and(eq(productsT.id, item.productId), eq(productsT.active, true)))
          .for("update");
        if (!p) throw new OrderError("محصولی یافت نشد");
        if (p.stock < qty) throw new OrderError(`موجودی «${p.name}» کافی نیست`);
        await tx
          .update(productsT)
          .set({ stock: p.stock - qty, updatedAt: new Date() })
          .where(eq(productsT.id, p.id));
        lines.push({
          productId: p.id,
          name: p.name,
          unitPrice: p.price,
          quantity: qty,
          image: p.image ?? undefined,
          imageKeyword: p.imageKeyword,
          imageLock: p.imageLock,
        });
      }

      const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const shipping =
        settings.freeShippingThreshold === 0 || subtotal >= settings.freeShippingThreshold
          ? 0
          : settings.shippingCost;

      const [ord] = await tx
        .insert(ordersT)
        .values({
          code: "PENDING", // real code needs the id; set just below
          customerName: input.customer.name.trim(),
          customerPhone: input.customer.phone.trim(),
          customerAddress: input.customer.address.trim(),
          customerNote: input.customer.note?.trim() || null,
          subtotal,
          shipping,
          total: subtotal + shipping,
          status: "pending",
        })
        .returning();

      const code = `MG-${1000 + ord.id}`;
      await tx.update(ordersT).set({ code }).where(eq(ordersT.id, ord.id));
      await tx.insert(orderItemsT).values(lines.map((l) => ({ orderId: ord.id, ...l, image: l.image ?? null })));

      return toOrder({ ...ord, code }, []); // items known from `lines`
        // (rebuild below so the returned order carries them)
    });

    // The transaction returns the order shell; attach the just-inserted items.
    return { order: (await getOrder(order.id))! };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<Order | undefined> {
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(ordersT).where(eq(ordersT.id, id)).for("update");
    if (!current) return undefined;

    // Cancelling returns items to stock, once, only on the transition in.
    if (status === "cancelled" && current.status !== "cancelled") {
      const items = await tx.select().from(orderItemsT).where(eq(orderItemsT.orderId, id));
      for (const it of items) {
        await tx
          .update(productsT)
          .set({ stock: sql`${productsT.stock} + ${it.quantity}`, updatedAt: new Date() })
          .where(eq(productsT.id, it.productId));
      }
    }

    const [row] = await tx
      .update(ordersT)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersT.id, id))
      .returning();
    return row;
  });

  if (!updated) return undefined;
  return getOrder(id);
}

/* ---------------------------------------------------- settings & pages */

export async function getSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(settingsT).where(eq(settingsT.id, 1));
  if (!row) throw new Error("settings row missing — did the data migration run?");
  return row.data;
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const next: SiteSettings = {
    ...current,
    ...patch,
    hero: { ...current.hero, ...(patch.hero ?? {}) },
    saleCampaign: { ...current.saleCampaign, ...(patch.saleCampaign ?? {}) },
    socials: { ...current.socials, ...(patch.socials ?? {}) },
  };
  await db.update(settingsT).set({ data: next }).where(eq(settingsT.id, 1));
  return next;
}

export interface PagesContent {
  about: AboutContent;
}

export async function getAboutContent(): Promise<AboutContent> {
  const [row] = await db.select().from(pagesT).where(eq(pagesT.id, 1));
  if (!row) throw new Error("pages row missing — did the data migration run?");
  return row.about;
}

export async function updateAboutContent(patch: Partial<AboutContent>): Promise<AboutContent> {
  const current = await getAboutContent();
  const about: AboutContent = { ...current, ...patch };
  await db.update(pagesT).set({ about }).where(eq(pagesT.id, 1));
  return about;
}

/* -------------------------------------------------------------- messages */

export async function listMessages(): Promise<ContactMessage[]> {
  const rows = await db.select().from(messagesT).orderBy(desc(messagesT.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function createMessage(
  input: Pick<ContactMessage, "name" | "email" | "subject" | "message">
): Promise<ContactMessage> {
  const [r] = await db
    .insert(messagesT)
    .values({
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      read: false,
    })
    .returning();
  return { ...r, createdAt: r.createdAt.toISOString() };
}

export async function setMessageRead(id: number, read: boolean): Promise<ContactMessage | undefined> {
  const [r] = await db.update(messagesT).set({ read }).where(eq(messagesT.id, id)).returning();
  return r ? { ...r, createdAt: r.createdAt.toISOString() } : undefined;
}

export async function deleteMessage(id: number): Promise<boolean> {
  return (await db.delete(messagesT).where(eq(messagesT.id, id)).returning({ id: messagesT.id })).length > 0;
}

/* ------------------------------------------------------------- dashboard */

export async function getDashboardStats() {
  const [allProducts, allOrders, lowStockRows, unreadRow, articleRow] = await Promise.all([
    db.select({ active: productsT.active }).from(productsT),
    db.select().from(ordersT),
    db
      .select({ id: productsT.id, name: productsT.name, stock: productsT.stock })
      .from(productsT)
      .where(and(eq(productsT.active, true), sql`${productsT.stock} <= 5`))
      .orderBy(productsT.stock),
    db.select({ n: sql<number>`count(*)::int` }).from(messagesT).where(eq(messagesT.read, false)),
    db.select({ n: sql<number>`count(*)::int` }).from(articlesT),
  ]);

  const activeOrders = allOrders.filter((o) => o.status !== "cancelled" && o.status !== "delivered");
  const revenue = allOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const recent = [...allOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  return {
    productCount: allProducts.length,
    activeProductCount: allProducts.filter((p) => p.active).length,
    lowStock: lowStockRows,
    orderCount: allOrders.length,
    openOrderCount: activeOrders.length,
    revenue,
    unreadMessages: unreadRow[0]?.n ?? 0,
    articleCount: articleRow[0]?.n ?? 0,
    recentOrders: await attachItems(recent),
    statusBreakdown: (
      ["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]
    ).map((status) => ({
      status,
      count: allOrders.filter((o) => o.status === status).length,
    })),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
