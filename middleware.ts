import { NextResponse, type NextRequest } from "next/server";
import { bareHost } from "@/lib/admin-host";

/**
 * Host-based admin routing, redirect half.
 *
 * The *mount* — serving app/admin/** from the root of the admin host — is a
 * host-matched rewrite in next.config.ts, not a NextResponse.rewrite() here.
 * See the comment there: middleware rewrites are proxied, not resolved, once
 * the app runs as a standalone server behind a proxy.
 *
 * What is left is canonicalisation, which redirects do correctly:
 *   admin host, /admin/*  ->  /*                       (one URL per page)
 *   main site,  /admin/*  ->  https://admin.host/*     (panel moved out)
 */

/** e.g. "admin.metalgallery.ir". Unset ⇒ panel stays at /admin (dev default). */
const ADMIN_HOST = bareHost(process.env.ADMIN_HOST);

/**
 * The port the client actually connected to, per the Host header.
 *
 * Behind the edge proxy that header is "admin.metalgallery.ir" with no port, so
 * a public redirect must not leak the container's internal 3000. Locally it is
 * "admin.localhost:3000" and the port has to survive. req.nextUrl.port is the
 * port the Node server listens on, which is neither.
 */
function clientPort(req: NextRequest): string {
  const host = req.headers.get("host") ?? "";
  const colon = host.lastIndexOf(":");
  return colon === -1 ? "" : host.slice(colon + 1);
}

/**
 * A URL usable as a public redirect: the host and port the client used, and the
 * scheme it used — which, behind a TLS-terminating proxy, comes from
 * X-Forwarded-Proto and is already reflected in req.nextUrl.protocol.
 */
function redirectTarget(req: NextRequest): URL {
  const url = req.nextUrl.clone();
  const host = bareHost(req.headers.get("host"));
  if (host) url.hostname = host;
  url.port = clientPort(req);
  return url;
}

export function middleware(req: NextRequest) {
  if (!ADMIN_HOST) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminPath) return NextResponse.next();

  const url = redirectTarget(req);
  url.pathname = pathname.slice("/admin".length) || "/";

  // On the admin host the prefix is redundant; on the main site the panel has
  // moved to its own host entirely.
  if (bareHost(req.headers.get("host")) !== ADMIN_HOST) url.hostname = ADMIN_HOST;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
