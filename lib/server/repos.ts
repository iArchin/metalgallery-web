import "server-only";
import { readCollection, updateCollection, nextId } from "./db";
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
  OrderStatus,
  Product,
  SiteSettings,
} from "../types";

const now = () => new Date().toISOString();

/* ------------------------------------------------------------- products */

export async function listProducts(opts?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const products = await readCollection<Product[]>("products");
  return opts?.includeInactive ? products : products.filter((p) => p.active);
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const products = await readCollection<Product[]>("products");
  return products.find((p) => p.id === id);
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export async function createProduct(input: ProductInput): Promise<Product> {
  return updateCollection<Product[], Product>("products", (products) => {
    const product: Product = {
      ...input,
      id: nextId(products),
      createdAt: now(),
      updatedAt: now(),
    };
    return { next: [...products, product], result: product };
  });
}

export async function updateProduct(
  id: number,
  patch: Partial<ProductInput>
): Promise<Product | undefined> {
  return updateCollection<Product[], Product | undefined>("products", (products) => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { next: products, result: undefined };
    const updated: Product = { ...products[idx], ...patch, id, updatedAt: now() };
    const next = [...products];
    next[idx] = updated;
    return { next, result: updated };
  });
}

export async function deleteProduct(id: number): Promise<boolean> {
  return updateCollection<Product[], boolean>("products", (products) => {
    const next = products.filter((p) => p.id !== id);
    return { next, result: next.length !== products.length };
  });
}

/* ----------------------------------------------------- simple collections */

function makeCrud<T extends { id: number }>(collection: "categories" | "brands" | "articles" | "news" | "gallery") {
  return {
    list: () => readCollection<T[]>(collection),
    get: async (id: number) =>
      (await readCollection<T[]>(collection)).find((i) => i.id === id),
    create: (input: Omit<T, "id">) =>
      updateCollection<T[], T>(collection, (items) => {
        const item = { ...input, id: nextId(items) } as T;
        return { next: [...items, item], result: item };
      }),
    update: (id: number, patch: Partial<Omit<T, "id">>) =>
      updateCollection<T[], T | undefined>(collection, (items) => {
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1) return { next: items, result: undefined };
        const updated = { ...items[idx], ...patch, id } as T;
        const next = [...items];
        next[idx] = updated;
        return { next, result: updated };
      }),
    remove: (id: number) =>
      updateCollection<T[], boolean>(collection, (items) => {
        const next = items.filter((i) => i.id !== id);
        return { next, result: next.length !== items.length };
      }),
  };
}

export const categoriesRepo = makeCrud<Category>("categories");
export const brandsRepo = makeCrud<Brand>("brands");
export const articlesRepo = makeCrud<Article>("articles");
export const newsRepo = makeCrud<NewsItem>("news");
export const galleryRepo = makeCrud<GalleryItem>("gallery");

/* --------------------------------------------------------------- orders */

export async function listOrders(): Promise<Order[]> {
  const orders = await readCollection<Order[]>("orders");
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: number): Promise<Order | undefined> {
  const orders = await readCollection<Order[]>("orders");
  return orders.find((o) => o.id === id);
}

/**
 * Checkout: validates stock against the product collection, snapshots names
 * and authoritative prices, decrements stock, and records the order.
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

  // Decrement stock first (serialized on the products queue)…
  const stockResult = await updateCollection<
    Product[],
    { error?: string; lines?: Order["items"] }
  >("products", (products) => {
    const lines: Order["items"] = [];
    const next = [...products];
    for (const item of input.items) {
      const qty = Math.max(1, Math.floor(item.quantity));
      const idx = next.findIndex((p) => p.id === item.productId && p.active);
      if (idx === -1) return { next: products, result: { error: "محصولی یافت نشد" } };
      const product = next[idx];
      if (product.stock < qty) {
        return {
          next: products,
          result: { error: `موجودی «${product.name}» کافی نیست` },
        };
      }
      next[idx] = { ...product, stock: product.stock - qty, updatedAt: now() };
      lines.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: qty,
        imageKeyword: product.imageKeyword,
        imageLock: product.imageLock,
      });
    }
    return { next, result: { lines } };
  });

  if (stockResult.error || !stockResult.lines) {
    return { error: stockResult.error ?? "خطای نامشخص" };
  }

  const subtotal = stockResult.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const shipping =
    settings.freeShippingThreshold === 0 || subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCost;

  // …then record the order.
  const order = await updateCollection<Order[], Order>("orders", (orders) => {
    const id = nextId(orders);
    const order: Order = {
      id,
      code: `MG-${1000 + id}`,
      items: stockResult.lines!,
      customer: {
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        address: input.customer.address.trim(),
        note: input.customer.note?.trim() || undefined,
      },
      subtotal,
      shipping,
      total: subtotal + shipping,
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    };
    return { next: [...orders, order], result: order };
  });

  return { order };
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<Order | undefined> {
  return updateCollection<Order[], Order | undefined>("orders", (orders) => {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return { next: orders, result: undefined };
    const updated: Order = { ...orders[idx], status, updatedAt: now() };
    const next = [...orders];
    next[idx] = updated;
    return { next, result: updated };
  });
}

/* ---------------------------------------------------- settings & pages */

export async function getSettings(): Promise<SiteSettings> {
  return readCollection<SiteSettings>("settings");
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  return updateCollection<SiteSettings, SiteSettings>("settings", (current) => {
    const next = {
      ...current,
      ...patch,
      hero: { ...current.hero, ...(patch.hero ?? {}) },
      saleCampaign: { ...current.saleCampaign, ...(patch.saleCampaign ?? {}) },
      socials: { ...current.socials, ...(patch.socials ?? {}) },
    };
    return { next, result: next };
  });
}

export interface PagesContent {
  about: AboutContent;
}

export async function getAboutContent(): Promise<AboutContent> {
  const pages = await readCollection<PagesContent>("pages");
  return pages.about;
}

export async function updateAboutContent(patch: Partial<AboutContent>): Promise<AboutContent> {
  return updateCollection<PagesContent, AboutContent>("pages", (pages) => {
    const about = { ...pages.about, ...patch };
    return { next: { ...pages, about }, result: about };
  });
}

/* -------------------------------------------------------------- messages */

export async function listMessages(): Promise<ContactMessage[]> {
  const messages = await readCollection<ContactMessage[]>("messages");
  return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMessage(
  input: Pick<ContactMessage, "name" | "email" | "subject" | "message">
): Promise<ContactMessage> {
  return updateCollection<ContactMessage[], ContactMessage>("messages", (messages) => {
    const message: ContactMessage = {
      id: nextId(messages),
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      read: false,
      createdAt: now(),
    };
    return { next: [...messages, message], result: message };
  });
}

export async function setMessageRead(id: number, read: boolean): Promise<ContactMessage | undefined> {
  return updateCollection<ContactMessage[], ContactMessage | undefined>(
    "messages",
    (messages) => {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx === -1) return { next: messages, result: undefined };
      const updated = { ...messages[idx], read };
      const next = [...messages];
      next[idx] = updated;
      return { next, result: updated };
    }
  );
}

export async function deleteMessage(id: number): Promise<boolean> {
  return updateCollection<ContactMessage[], boolean>("messages", (messages) => {
    const next = messages.filter((m) => m.id !== id);
    return { next, result: next.length !== messages.length };
  });
}

/* ------------------------------------------------------------- dashboard */

export async function getDashboardStats() {
  const [products, orders, messages, articles] = await Promise.all([
    readCollection<Product[]>("products"),
    readCollection<Order[]>("orders"),
    readCollection<ContactMessage[]>("messages"),
    readCollection<Article[]>("articles"),
  ]);

  const activeOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "delivered"
  );
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  return {
    productCount: products.length,
    activeProductCount: products.filter((p) => p.active).length,
    lowStock: products
      .filter((p) => p.active && p.stock <= 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    orderCount: orders.length,
    openOrderCount: activeOrders.length,
    revenue,
    unreadMessages: messages.filter((m) => !m.read).length,
    articleCount: articles.length,
    recentOrders: [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6),
    statusBreakdown: (
      ["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]
    ).map((status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
    })),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
