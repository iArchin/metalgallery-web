import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/server/auth";
import OtpLoginForm from "@/app/components/OtpLoginForm";

export const metadata: Metadata = {
  title: "ورود | متال گالری",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next && next.startsWith("/") ? next : "/";

  const customer = await getCurrentCustomer();
  if (customer) redirect(dest);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-content">ورود / ثبت‌نام</h1>
          <p className="text-sm text-content-muted mt-1">
            برای ورود، شماره موبایل خود را وارد کنید تا کد تایید برایتان ارسال شود.
          </p>
        </div>
        <OtpLoginForm scope="user" redirectTo={dest} />
      </div>
    </div>
  );
}
