"use client";

import OtpLoginForm from "@/app/components/OtpLoginForm";

export default function LoginForm({ redirectTo = "/admin" }: { redirectTo?: string }) {
  return <OtpLoginForm scope="admin" redirectTo={redirectTo} />;
}
