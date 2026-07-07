import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ورود به پنل مدیریت | متال گالری",
};

export default async function AdminLoginPage() {
  // Already signed in → straight to the dashboard.
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-content">پنل مدیریت</h1>
          <p className="text-sm text-content-muted mt-1">متال گالری</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
