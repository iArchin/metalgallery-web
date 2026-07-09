/**
 * The admin panel lives in `app/admin/**`, but where it is *mounted* depends on
 * the host it is served from:
 *
 *   • main site (metalgallery.ir)  → mounted at "/admin"
 *   • admin host (admin.metalgallery.ir) → mounted at the root ("")
 *
 * A host-matched rewrite in `next.config.ts` serves the admin host's root from
 * `/admin/**`, and `middleware.ts` redirects the leftover "/admin" URLs away.
 * Everything inside the panel must therefore build links through `adminHref()`
 * rather than hardcoding "/admin/...", so the same code works on both hosts.
 *
 * Enable the subdomain by setting ADMIN_HOST (see .env.example). When it is
 * unset the panel simply stays at /admin — the local-dev default.
 */

export type AdminBase = "" | "/admin";

/** Strip any port from a Host header value. */
export function bareHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0];
}

/**
 * Infer where the panel is mounted from the browser's pathname. On the admin
 * host the URL never contains "/admin" (middleware canonicalises it away), so
 * the presence of the prefix tells us we're on the main site.
 */
export function adminBaseFromPathname(pathname: string): AdminBase {
  return pathname === "/admin" || pathname.startsWith("/admin/") ? "/admin" : "";
}

/** Build a panel link. `path` is relative to the panel root ("" = dashboard). */
export function adminHref(base: AdminBase, path: string): string {
  const p = path === "/" ? "" : path;
  return base ? `${base}${p}` : p || "/";
}
