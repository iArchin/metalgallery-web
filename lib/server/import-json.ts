import { promises as fs } from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  products,
  categories,
  brands,
  orders,
  orderItems,
  articles,
  news,
  gallery,
  messages,
  adminUsers,
  customers,
  chats,
  chatMessages,
  settings,
  pages,
} from "./schema";

/**
 * One-time import of the legacy JSON collections into Postgres.
 *
 * Runs at boot (instrumentation) only when the database is empty, so it is a
 * no-op on every subsequent start. Used for the cutover: the mg_data volume
 * still holds the live JSON at that moment, so the real catalog, orders and
 * customers move across untouched. Falls back to the baked data.seed for a
 * genuinely fresh volume.
 *
 * IDs are preserved (order code MG-1043 stays MG-1043) by inserting explicit
 * ids and then advancing each serial sequence past the max.
 */

async function readJson<T>(dir: string, name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, `${name}.json`), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

const toDate = (s: string | undefined): Date => (s ? new Date(s) : new Date());

/** Advance a table's id sequence past the largest imported id. */
async function resyncSequence(table: string): Promise<void> {
  await db.execute(
    sql.raw(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'),
                     GREATEST((SELECT COALESCE(MAX(id), 0) FROM "${table}"), 1))`
    )
  );
}

/** True if the store has never been populated (no products yet). */
export async function isDatabaseEmpty(): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  return (row?.n ?? 0) === 0;
}

/** Pick the import source: the live volume's JSON if present, else data.seed. */
export async function pickImportDir(): Promise<string | null> {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const seedDir = path.join(process.cwd(), "data.seed");
  for (const dir of [dataDir, seedDir]) {
    try {
      await fs.access(path.join(dir, "products.json"));
      return dir;
    } catch {
      /* try next */
    }
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function importFromDir(dir: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const productsJson = await readJson<any[]>(dir, "products", []);
  if (productsJson.length) {
    await db.insert(products).values(
      productsJson.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        categoryId: p.categoryId,
        ageGroup: p.ageGroup ?? "",
        stock: p.stock ?? 0,
        rating: p.rating ?? 0,
        reviewCount: p.reviewCount ?? 0,
        image: p.image ?? null,
        imageKeyword: p.imageKeyword ?? "",
        imageLock: p.imageLock ?? 0,
        isDeal: !!p.isDeal,
        isFlashSale: !!p.isFlashSale,
        isTrending: !!p.isTrending,
        active: p.active !== false,
        specifications: p.specifications ?? {},
        createdAt: toDate(p.createdAt),
        updatedAt: toDate(p.updatedAt),
      }))
    );
    await resyncSequence("products");
  }
  counts.products = productsJson.length;

  const catsJson = await readJson<any[]>(dir, "categories", []);
  if (catsJson.length) {
    await db.insert(categories).values(
      catsJson.map((c) => ({
        id: c.id,
        name: c.name,
        imageKeyword: c.imageKeyword ?? "",
        imageLock: c.imageLock ?? 0,
        active: c.active !== false,
        image: c.image ?? null,
      }))
    );
    await resyncSequence("categories");
  }
  counts.categories = catsJson.length;

  const brandsJson = await readJson<any[]>(dir, "brands", []);
  if (brandsJson.length) {
    await db.insert(brands).values(
      brandsJson.map((b) => ({
        id: b.id,
        name: b.name,
        items: b.items ?? 0,
        active: b.active !== false,
        logo: b.logo ?? null,
      }))
    );
    await resyncSequence("brands");
  }
  counts.brands = brandsJson.length;

  const ordersJson = await readJson<any[]>(dir, "orders", []);
  if (ordersJson.length) {
    await db.insert(orders).values(
      ordersJson.map((o) => ({
        id: o.id,
        code: o.code,
        customerName: o.customer?.name ?? "",
        customerPhone: o.customer?.phone ?? "",
        customerAddress: o.customer?.address ?? "",
        customerNote: o.customer?.note ?? null,
        subtotal: o.subtotal ?? 0,
        shipping: o.shipping ?? 0,
        total: o.total ?? 0,
        status: o.status ?? "pending",
        createdAt: toDate(o.createdAt),
        updatedAt: toDate(o.updatedAt),
      }))
    );
    await resyncSequence("orders");
    const items = ordersJson.flatMap((o) =>
      (o.items ?? []).map((it: any) => ({
        orderId: o.id,
        productId: it.productId,
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        image: it.image ?? null,
        imageKeyword: it.imageKeyword ?? "",
        imageLock: it.imageLock ?? 0,
      }))
    );
    if (items.length) {
      await db.insert(orderItems).values(items);
      await resyncSequence("order_items");
    }
  }
  counts.orders = ordersJson.length;

  const articlesJson = await readJson<any[]>(dir, "articles", []);
  if (articlesJson.length) {
    await db.insert(articles).values(
      articlesJson.map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt ?? "",
        content: a.content ?? [],
        date: a.date ?? "",
        author: a.author ?? "",
        category: a.category ?? "",
        readingMinutes: a.readingMinutes ?? 1,
        imageKeyword: a.imageKeyword ?? "",
        imageLock: a.imageLock ?? 0,
        published: a.published !== false,
      }))
    );
    await resyncSequence("articles");
  }
  counts.articles = articlesJson.length;

  const newsJson = await readJson<any[]>(dir, "news", []);
  if (newsJson.length) {
    await db.insert(news).values(
      newsJson.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body ?? "",
        date: n.date ?? "",
        tag: n.tag ?? "",
        published: n.published !== false,
      }))
    );
    await resyncSequence("news");
  }
  counts.news = newsJson.length;

  const galleryJson = await readJson<any[]>(dir, "gallery", []);
  if (galleryJson.length) {
    await db.insert(gallery).values(
      galleryJson.map((g) => ({
        id: g.id,
        caption: g.caption ?? "",
        imageKeyword: g.imageKeyword ?? "",
        imageLock: g.imageLock ?? 0,
        active: g.active !== false,
      }))
    );
    await resyncSequence("gallery");
  }
  counts.gallery = galleryJson.length;

  const messagesJson = await readJson<any[]>(dir, "messages", []);
  if (messagesJson.length) {
    await db.insert(messages).values(
      messagesJson.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email ?? "",
        subject: m.subject ?? "",
        message: m.message ?? "",
        read: !!m.read,
        createdAt: toDate(m.createdAt),
      }))
    );
    await resyncSequence("messages");
  }
  counts.messages = messagesJson.length;

  const usersJson = await readJson<any[]>(dir, "users", []);
  if (usersJson.length) {
    await db.insert(adminUsers).values(
      usersJson.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name ?? "",
        passwordHash: u.passwordHash ?? "",
        phone: u.phone ?? null,
        role: "admin",
      }))
    );
    await resyncSequence("admin_users");
  }
  counts.users = usersJson.length;

  const customersJson = await readJson<any[]>(dir, "customers", []);
  if (customersJson.length) {
    await db.insert(customers).values(
      customersJson.map((c) => ({
        id: c.id,
        phone: c.phone,
        name: c.name ?? "",
        avatar: c.avatar ?? null,
        address: c.address ?? null,
        createdAt: toDate(c.createdAt),
        lastLoginAt: toDate(c.lastLoginAt),
      }))
    );
    await resyncSequence("customers");
  }
  counts.customers = customersJson.length;

  const chatsJson = await readJson<any[]>(dir, "chats", []);
  if (chatsJson.length) {
    await db.insert(chats).values(
      chatsJson.map((c) => ({
        id: c.id,
        label: c.label ?? "",
        createdAt: toDate(c.createdAt),
        updatedAt: toDate(c.updatedAt),
        unreadForAdmin: c.unreadForAdmin ?? 0,
      }))
    );
    const msgs = chatsJson.flatMap((c) =>
      (c.messages ?? []).map((m: any) => ({
        chatId: c.id,
        fromRole: m.from,
        text: m.text,
        at: toDate(m.at),
      }))
    );
    if (msgs.length) {
      await db.insert(chatMessages).values(msgs);
      await resyncSequence("chat_messages");
    }
  }
  counts.chats = chatsJson.length;

  // singletons
  const settingsJson = await readJson<any | null>(dir, "settings", null);
  if (settingsJson) {
    await db
      .insert(settings)
      .values({ id: 1, data: settingsJson })
      .onConflictDoNothing();
  }
  const pagesJson = await readJson<any | null>(dir, "pages", null);
  if (pagesJson?.about) {
    await db
      .insert(pages)
      .values({ id: 1, about: pagesJson.about })
      .onConflictDoNothing();
  }

  return counts;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
