"use client";

import { usePathname } from "next/navigation";
import { adminBaseFromPathname, adminHref, type AdminBase } from "@/lib/admin-host";

/**
 * Resolves where the panel is mounted for the current host and returns a link
 * builder. Use `href("/orders")` instead of hardcoding "/admin/orders" so the
 * panel works both at /admin and at the root of the admin subdomain.
 */
export function useAdminBase(): {
  base: AdminBase;
  href: (path: string) => string;
  pathname: string;
} {
  const pathname = usePathname();
  const base = adminBaseFromPathname(pathname);
  return { base, href: (path: string) => adminHref(base, path), pathname };
}
