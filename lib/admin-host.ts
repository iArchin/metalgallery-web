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

/**
 * Build a link from inside the panel to a page on the *public storefront* —
 * e.g. siteHref(base, "/product/12").
 *
 * With the panel mounted at /admin the storefront is the same origin, so a
 * root-relative path is both correct and portable (localhost, staging, prod).
 * On the admin subdomain it is a different origin, so the link has to be
 * absolute, and NEXT_PUBLIC_SITE_URL is the only thing that knows the main
 * site's address. When that is unset — local dev against admin.localhost —
 * fall back to the relative path: it may not resolve, but it is never a
 * link to the wrong site.
 */
export function siteHref(base: AdminBase, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base === "/admin") return p;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return origin ? `${origin}${p}` : p;
}
