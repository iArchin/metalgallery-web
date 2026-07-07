import { requireAdminOrRedirect } from "@/lib/server/auth";
import AdminShell from "../_components/AdminShell";

export const metadata = {
  title: "پنل مدیریت | متال گالری",
};

/** Every page in the panel group is guarded here. */
export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdminOrRedirect();
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
