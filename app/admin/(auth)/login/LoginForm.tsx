"use client";

import OtpLoginForm from "@/app/components/OtpLoginForm";

export default function LoginForm() {
  return <OtpLoginForm scope="admin" redirectTo="/admin" />;
}
