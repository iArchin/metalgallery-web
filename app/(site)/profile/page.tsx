import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/server/auth";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = {
  title: "پروفایل من | متال گالری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/profile");

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-content mb-1">پروفایل من</h1>
      <p className="text-sm text-content-muted mb-6 sm:mb-8">
        نام، تصویر و آدرس تحویل خود را مدیریت کنید. این اطلاعات هنگام ثبت سفارش استفاده می‌شود.
      </p>

      <ProfileForm customer={customer} />
    </main>
  );
}
