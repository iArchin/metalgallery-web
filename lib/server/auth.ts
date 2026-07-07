import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readCollection } from "./db";
import type { AdminUser } from "../types";

const SESSION_COOKIE = "mg_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Prefer an env secret; fall back to a fixed dev secret so the panel works
// out of the box on a local machine. Set SESSION_SECRET in production.
const SECRET =
  process.env.SESSION_SECRET ?? "metalgallery-dev-secret-change-in-production";

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
  if (!admin) redirect("/admin/login");
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
