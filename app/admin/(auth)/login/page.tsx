import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/auth";
import { getAdminBase } from "@/lib/server/admin-base";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ورود به پنل مدیریت | متال گالری",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // The panel root: "/" on the admin host, "/admin" on the main site.
  const base = await getAdminBase();
  const panelRoot = base || "/";

  // Already signed in → straight to the dashboard.
  const admin = await getCurrentAdmin();
  if (admin) redirect(panelRoot);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-content">پنل مدیریت</h1>
          <p className="text-sm text-content-muted mt-1">متال گالری</p>
        </div>
        <LoginForm redirectTo={panelRoot} />
      </div>
    </div>
  );
}
