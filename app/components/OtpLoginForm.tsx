"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPersianNumber } from "@/app/utils/numbers";

const inputClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

/**
 * Phone + OTP login. `scope="admin"` posts admin-scoped verifications (only
 * registered admin numbers are accepted); otherwise it logs in a customer.
 */
export default function OtpLoginForm({
  scope,
  redirectTo,
}: {
  scope: "user" | "admin";
  redirectTo: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendOtp() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, scope }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "ارسال کد ناموفق بود");
        if (json.cooldown) setCooldown(json.cooldown);
        return;
      }
      setStep("code");
      // Must match RESEND_COOLDOWN_MS in lib/server/otp.ts — a shorter value
      // re-enables the button only for the server to answer 429.
      setCooldown(120);
      if (json.data?.devCode) {
        setInfo(`کد پیامک (حالت آزمایشی): ${json.data.devCode}`);
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, scope }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "کد تایید نادرست است");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        void (step === "phone" ? sendOtp() : verify());
      }}
      className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm"
    >
      {error && (
        <div className="rounded-xl bg-primary-soft text-primary px-3.5 py-2.5 text-sm font-bold">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl bg-mint-soft text-mint px-3.5 py-2.5 text-sm font-bold" dir="ltr">
          {info}
        </div>
      )}

      {step === "phone" ? (
        <label className="block">
          <span className="block text-sm font-bold text-content mb-1.5">شماره موبایل</span>
          <input
            type="tel"
            dir="ltr"
            inputMode="numeric"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxxx"
            className={`${inputClass} text-center tracking-widest`}
          />
        </label>
      ) : (
        <>
          <div className="text-sm text-content-muted">
            کد تایید به شماره{" "}
            <span dir="ltr" className="font-bold text-content">
              {toPersianNumber(phone)}
            </span>{" "}
            ارسال شد.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setInfo(null);
              }}
              className="font-bold text-primary hover:underline"
            >
              ویرایش شماره
            </button>
          </div>
          <label className="block">
            <span className="block text-sm font-bold text-content mb-1.5">کد تایید</span>
            <input
              ref={codeRef}
              type="text"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="- - - - -"
              className={`${inputClass} text-center text-lg tracking-[0.5em]`}
            />
          </label>
          <button
            type="button"
            disabled={cooldown > 0 || busy}
            onClick={() => void sendOtp()}
            className="text-sm font-bold text-primary hover:underline disabled:text-content-subtle disabled:no-underline"
          >
            {cooldown > 0
              ? `ارسال مجدد کد تا ${toPersianNumber(cooldown)} ثانیه دیگر`
              : "ارسال مجدد کد"}
          </button>
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary px-6 py-2.5 font-bold text-primary-content hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {busy
          ? "لطفاً صبر کنید…"
          : step === "phone"
            ? "دریافت کد تایید"
            : "ورود"}
      </button>
    </form>
  );
}
