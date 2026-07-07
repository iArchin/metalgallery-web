"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "ورود ناموفق بود");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

  return (
    <form
      onSubmit={submit}
      className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm"
    >
      {error && (
        <div className="rounded-xl bg-primary-soft text-primary px-3.5 py-2.5 text-sm font-bold">
          {error}
        </div>
      )}
      <label className="block">
        <span className="block text-sm font-bold text-content mb-1.5">ایمیل</span>
        <input
          type="email"
          dir="ltr"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@metalgallery.ir"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-bold text-content mb-1.5">رمز عبور</span>
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary px-6 py-2.5 font-bold text-primary-content hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {busy ? "در حال ورود…" : "ورود"}
      </button>
    </form>
  );
}
