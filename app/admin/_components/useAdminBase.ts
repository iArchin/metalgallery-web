"use client";

import { usePathname } from "next/navigation";
import {
  adminBaseFromPathname,
  adminHref,
  siteHref,
  type AdminBase,
} from "@/lib/admin-host";

/**
 * Resolves where the panel is mounted for the current host and returns two link
 * builders. Use `href("/orders")` instead of hardcoding "/admin/orders" so the
 * panel works both at /admin and at the root of the admin subdomain, and
 * `storeHref("/product/12")` for links that leave the panel for the storefront.
 */
export function useAdminBase(): {
  base: AdminBase;
  href: (path: string) => string;
  storeHref: (path: string) => string;
  pathname: string;
} {
  const pathname = usePathname();
  const base = adminBaseFromPathname(pathname);
  return {
    base,
    href: (path: string) => adminHref(base, path),
    storeHref: (path: string) => siteHref(base, path),
    pathname,
  };
}
