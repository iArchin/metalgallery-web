import { requireAdminOrRedirect } from "@/lib/server/auth";
import AdminShell from "../_components/AdminShell";

export const metadata = {
  title: "پنل مدیریت | متال گالری",
  // robots.txt disallows /admin/, but on the admin subdomain the panel sits at
  // "/" and robots.txt is per-host, so that rule reads as "allow" there. Tag the
  // pages themselves; the Caddy vhost adds X-Robots-Tag as a second layer.
  robots: { index: false, follow: false },
};

/** Every page in the panel group is guarded here. */
export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdminOrRedirect();
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
