import "server-only";
import { headers } from "next/headers";
import { bareHost, type AdminBase } from "../admin-host";

const ADMIN_HOST = bareHost(process.env.ADMIN_HOST);

/**
 * Where the panel is mounted for the current request: "" on the admin host,
 * "/admin" everywhere else (including when ADMIN_HOST isn't configured).
 *
 * The host-matched rewrite in next.config.ts is resolved inside the router, so
 * the original Host header survives it and remains the authoritative signal.
 */
export async function getAdminBase(): Promise<AdminBase> {
  if (!ADMIN_HOST) return "/admin";
  const h = await headers();
  return bareHost(h.get("host")) === ADMIN_HOST ? "" : "/admin";
}
