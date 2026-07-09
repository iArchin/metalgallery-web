import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readCollection, updateCollection, nextId } from "./db";
import { getAdminBase } from "./admin-base";
import { normalizePhone } from "./otp";
import { SESSION_SECRET as SECRET } from "./secret";
import type { AdminUser, Customer } from "../types";

const SESSION_COOKIE = "mg_admin_session";
const USER_SESSION_COOKIE = "mg_user_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ------------------------------------------------------------ passwords
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// -------------------------------------------------------------- sessions
interface SessionPayload {
  userId: number;
  exp: number; // epoch ms
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(userId: number): string {
  const payload: SessionPayload = { userId, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The logged-in admin, or null. Safe to call from layouts, pages and APIs. */
export async function getCurrentAdmin(): Promise<Omit<AdminUser, "passwordHash"> | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const users = await readCollection<AdminUser[]>("users");
  const user = users.find((u) => u.id === payload.userId);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Panel guard for server layouts/pages — redirects anonymous visitors. */
export async function requireAdminOrRedirect() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    // "/login" on the admin host, "/admin/login" on the main site.
    const base = await getAdminBase();
    redirect(`${base}/login`);
  }
  return admin;
}

/** API guard — returns null when authorized, or a 401 Response. */
export async function requireAdminApi(): Promise<Response | null> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json(
      { ok: false, error: "برای انجام این عملیات باید وارد شوید" },
      { status: 401 }
    );
  }
  return null;
}

export async function findUserByEmail(email: string): Promise<AdminUser | undefined> {
  const users = await readCollection<AdminUser[]>("users");
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/** The admin whose registered phone matches (canonical `09…`), if any. */
export async function findAdminByPhone(phone: string): Promise<AdminUser | undefined> {
  const users = await readCollection<AdminUser[]>("users");
  return users.find((u) => u.phone && normalizePhone(u.phone) === phone);
}

// ----------------------------------------------------- customer sessions

export async function setCustomerSessionCookie(customerId: number): Promise<void> {
  const store = await cookies();
  store.set(USER_SESSION_COOKIE, createSessionToken(customerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearCustomerSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_SESSION_COOKIE);
}

/** The logged-in customer, or null. Safe to call from pages and APIs. */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(USER_SESSION_COOKIE)?.value);
  if (!payload) return null;
  const customers = await readCollection<Customer[]>("customers");
  return customers.find((c) => c.id === payload.userId) ?? null;
}

export type CustomerProfilePatch = Partial<Pick<Customer, "name" | "avatar" | "address">>;

/** Update the logged-in customer's editable profile fields. */
export async function updateCustomer(
  id: number,
  patch: CustomerProfilePatch
): Promise<Customer | undefined> {
  return updateCollection<Customer[], Customer | undefined>("customers", (customers) => {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return { next: customers, result: undefined };
    // id and phone are identity fields — never overwritten by a profile edit.
    const updated: Customer = {
      ...customers[idx],
      ...patch,
      id: customers[idx].id,
      phone: customers[idx].phone,
    };
    const next = [...customers];
    next[idx] = updated;
    return { next, result: updated };
  });
}

/** Find the customer for a (canonical) phone, creating one on first login. */
export async function findOrCreateCustomer(phone: string): Promise<Customer> {
  return updateCollection<Customer[], Customer>("customers", (customers) => {
    const now = new Date().toISOString();
    const idx = customers.findIndex((c) => c.phone === phone);
    if (idx !== -1) {
      const updated: Customer = { ...customers[idx], lastLoginAt: now };
      const next = [...customers];
      next[idx] = updated;
      return { next, result: updated };
    }
    const customer: Customer = {
      id: nextId(customers),
      phone,
      name: "",
      createdAt: now,
      lastLoginAt: now,
    };
    return { next: [...customers, customer], result: customer };
  });
}
