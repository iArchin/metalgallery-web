import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  real,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  CustomerAddress,
  SiteSettings,
  AboutContent,
} from "../types";

/**
 * Postgres schema for metalgallery, defined with Drizzle.
 *
 * Relational where the data is relational (products, orders + order_items,
 * chats + chat_messages). `jsonb` only for genuinely document-shaped values that
 * are always read and written whole: product specs, a customer's address, the
 * site settings blob, and the about-page content.
 *
 * IDs stay integers to match the existing data and the human order codes
 * (MG-1043 = order id 43). The data migration inserts explicit ids and then
 * advances each sequence, so new rows continue from the right number.
 */

// ------------------------------------------------------------------ products
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    originalPrice: integer("original_price"),
    categoryId: integer("category_id").notNull(),
    ageGroup: text("age_group").notNull().default(""),
    stock: integer("stock").notNull().default(0),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    image: text("image"),
    imageKeyword: text("image_keyword").notNull().default(""),
    imageLock: integer("image_lock").notNull().default(0),
    isDeal: boolean("is_deal").notNull().default(false),
    isFlashSale: boolean("is_flash_sale").notNull().default(false),
    isTrending: boolean("is_trending").notNull().default(false),
    active: boolean("active").notNull().default(true),
    specifications: jsonb("specifications")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_active_idx").on(t.active),
    index("products_category_idx").on(t.categoryId),
    // partial-ish flags used by the home sections; small tables so plain indexes
    index("products_deal_idx").on(t.isDeal),
    index("products_flash_idx").on(t.isFlashSale),
    index("products_trending_idx").on(t.isTrending),
  ]
);

// ---------------------------------------------------------------- categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageKeyword: text("image_keyword").notNull().default(""),
  imageLock: integer("image_lock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  image: text("image"),
});

// -------------------------------------------------------------------- brands
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  items: integer("items").notNull().default(0),
  active: boolean("active").notNull().default(true),
  logo: text("logo"),
});

// -------------------------------------------------------------------- orders
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    // customer is a 1:1 snapshot at purchase time — flat columns, not a table
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerAddress: text("customer_address").notNull(),
    customerNote: text("customer_note"),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull().default(0),
    total: integer("total").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_phone_idx").on(t.customerPhone), // listOrdersByPhone
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    name: text("name").notNull(), // snapshot
    unitPrice: integer("unit_price").notNull(), // snapshot
    quantity: integer("quantity").notNull(),
    image: text("image"),
    imageKeyword: text("image_keyword").notNull().default(""),
    imageLock: integer("image_lock").notNull().default(0),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

// ------------------------------------------------------------------ articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: jsonb("content").$type<string[]>().notNull().default([]), // paragraphs
  date: text("date").notNull().default(""),
  author: text("author").notNull().default(""),
  category: text("category").notNull().default(""),
  readingMinutes: integer("reading_minutes").notNull().default(1),
  imageKeyword: text("image_keyword").notNull().default(""),
  imageLock: integer("image_lock").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

// ---------------------------------------------------------------------- news
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  date: text("date").notNull().default(""),
  tag: text("tag").notNull().default(""),
  published: boolean("published").notNull().default(true),
});

// ------------------------------------------------------------------- gallery
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  caption: text("caption").notNull().default(""),
  imageKeyword: text("image_keyword").notNull().default(""),
  imageLock: integer("image_lock").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---------------------------------------------------------- contact messages
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    subject: text("subject").notNull().default(""),
    message: text("message").notNull().default(""),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_read_idx").on(t.read)]
);

// --------------------------------------------------------------- admin users
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    passwordHash: text("password_hash").notNull().default(""),
    phone: text("phone"),
    role: text("role").notNull().default("admin"),
  },
  (t) => [index("admin_users_phone_idx").on(t.phone)]
);

// ---------------------------------------------------------------- customers
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    name: text("name").notNull().default(""),
    avatar: text("avatar"),
    address: jsonb("address").$type<CustomerAddress>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_phone_uidx").on(t.phone)]
);

// --------------------------------------------------------------------- otps
// One row per phone (the JSON version was keyed by phone). Codes are stored
// hashed with a short TTL, a resend cooldown and an attempt cap.
//
// prev_* keep the previous code alive through a resend: the verify SMS path
// can take minutes to deliver, so the SMS from the previous request is often
// still in flight when the user asks for a new code. Without this, that SMS
// arrives carrying a code the resend already overwrote. verifyOtp accepts
// either code while its own expiry holds.
export const otps = pgTable("otps", {
  phone: text("phone").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull().defaultNow(),
  prevCodeHash: text("prev_code_hash"),
  prevExpiresAt: timestamp("prev_expires_at", { withTimezone: true }),
});

// --------------------------------------------------------------- support chat
export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(), // a token the browser keeps
    label: text("label").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    unreadForAdmin: integer("unread_for_admin").notNull().default(0),
  },
  (t) => [index("chats_updated_idx").on(t.updatedAt)]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    fromRole: text("from_role").notNull(), // "user" | "admin"
    text: text("text").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_chat_idx").on(t.chatId)]
);

// ------------------------------------------------------ singletons (jsonb)
// settings and the about page are one nested document each, always read/written
// whole. A single-row table with a jsonb payload keyed by a fixed id.
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(), // always 1
  data: jsonb("data").$type<SiteSettings>().notNull(),
});

export const pages = pgTable("pages", {
  id: integer("id").primaryKey(), // always 1
  about: jsonb("about").$type<AboutContent>().notNull(),
});
