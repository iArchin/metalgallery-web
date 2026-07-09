"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { toPersianNumber, formatPersianNumber } from "@/app/utils/numbers";

interface SuccessInfo {
  code: string;
  total: number;
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow";

export default function CartClient({
  freeShippingThreshold = 0,
  shippingCost = 0,
}: {
  freeShippingThreshold?: number;
  shippingCost?: number;
}) {
  const { items, count, subtotal, remove, setQuantity, clear } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Prefill the checkout from the logged-in customer's saved profile so paying
  // customers don't retype their details; if the profile lacks a name/address,
  // nudge them to complete it.
  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j || !j.ok) return;
        const c = j.data;
        const addr = c.address;
        const composed = addr?.full
          ? addr.postalCode
            ? `${addr.full} — کد پستی: ${addr.postalCode}`
            : addr.full
          : "";
        setName((v) => v || c.name || "");
        setPhone((v) => v || c.phone || "");
        setAddress((v) => v || composed);
        if (!c.name || !addr?.full) setProfileIncomplete(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("لطفاً نام، شماره تماس و آدرس را کامل وارد کنید.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note.trim() || undefined,
          },
        }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { code: string; total: number } }
        | { ok: false; error?: string };

      if (!json.ok) {
        setError(json.error || "ثبت سفارش ناموفق بود. دوباره تلاش کنید.");
        return;
      }

      setSuccess({ code: json.data.code, total: json.data.total });
      clear();
    } catch {
      setError("خطا در برقراری ارتباط با سرور. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- (3) success state ---------- */
  if (success) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-mint-soft flex items-center justify-center">
            <svg
              className="w-10 h-10 text-mint"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-content">
            سفارش شما ثبت شد
          </h1>

          <p className="mt-4 text-sm text-content-muted">کد پیگیری سفارش:</p>
          <p
            dir="ltr"
            className="mt-2 text-2xl sm:text-3xl font-bold text-primary tracking-widest"
          >
            {success.code}
          </p>

          <p className="mt-4 text-sm sm:text-base text-content">
            مبلغ سفارش:{" "}
            <span className="font-bold">
              {formatPersianNumber(success.total)} تومان
            </span>
          </p>
          <p className="mt-2 text-sm text-content-muted leading-relaxed">
            این کد را برای پیگیری سفارش خود نگه دارید.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto">
                ادامه خرید
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                بازگشت به خانه
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- (1) empty state ---------- */
  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-content mb-6 md:mb-8">
          سبد خرید
        </h1>
        <div className="max-w-md mx-auto bg-surface border border-border rounded-2xl shadow-sm p-8 sm:p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-content-subtle"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
            />
          </svg>
          <h2 className="mt-4 text-lg sm:text-xl font-bold text-content">
            سبد خرید شما خالی است
          </h2>
          <p className="mt-2 text-sm text-content-muted leading-relaxed">
            هنوز کالایی به سبد خرید اضافه نکرده‌اید. سری به فروشگاه بزنید و
            اسباب‌بازی موردعلاقه‌تان را پیدا کنید.
          </p>
          <div className="mt-6">
            <Link href="/products" className="inline-block">
              <Button variant="primary">مشاهده محصولات</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- (2) cart view ---------- */
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-content">
          سبد خرید
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          {toPersianNumber(count)} کالا در سبد خرید شما
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-surface border border-border rounded-2xl shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4"
            >
              <Link
                href={`/product/${item.productId}`}
                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-surface-2"
              >
                <img
                  src={productImage(item)}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.productId}`}
                      className="block text-content font-bold text-sm sm:text-base hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-content-muted text-xs sm:text-sm">
                      قیمت واحد: {formatPersianNumber(item.price)} تومان
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    aria-label={`حذف ${item.name} از سبد خرید`}
                    className="p-2 -m-1 text-content-subtle hover:text-primary active:text-primary transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="افزایش تعداد"
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-content hover:bg-surface-2 active:bg-surface-3 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                    <span className="min-w-8 text-center text-content font-bold text-sm">
                      {toPersianNumber(item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      aria-label="کاهش تعداد"
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-content hover:bg-surface-2 active:bg-surface-3 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14"
                        />
                      </svg>
                    </button>
                  </div>

                  <p className="text-content font-bold text-sm sm:text-base">
                    {formatPersianNumber(item.price * item.quantity)} تومان
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + checkout */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-surface border border-border rounded-2xl shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-content mb-4">
              خلاصه سفارش
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-content-muted">
                  جمع کل ({toPersianNumber(count)} کالا)
                </span>
                <span className="text-content font-bold">
                  {formatPersianNumber(subtotal)} تومان
                </span>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                {freeShippingThreshold > 0
                  ? `ارسال سفارش‌های بالای ${formatPersianNumber(freeShippingThreshold)} تومان رایگان است؛ در غیر این صورت هزینه ارسال ${formatPersianNumber(shippingCost)} تومان است.`
                  : "ارسال برای همه سفارش‌ها رایگان است."}{" "}
                هزینه نهایی ارسال هنگام ثبت سفارش محاسبه می‌شود.
              </p>
            </div>

            <div className="my-4 border-t border-border" />

            {!showCheckout ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowCheckout(true)}
              >
                ثبت سفارش
              </Button>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <h3 className="text-sm font-bold text-content">
                  اطلاعات گیرنده
                </h3>

                {profileIncomplete && (
                  <div className="rounded-xl bg-primary-soft px-3.5 py-2.5 text-xs font-bold text-primary flex items-center justify-between gap-2">
                    <span>برای ثبت خودکار اطلاعات، پروفایل خود را کامل کنید.</span>
                    <Link href="/profile" className="shrink-0 underline hover:no-underline">
                      تکمیل پروفایل
                    </Link>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block mb-1.5 text-sm text-content"
                  >
                    نام و نام خانوادگی <span className="text-primary">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً سارا محمدی"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block mb-1.5 text-sm text-content"
                  >
                    شماره تماس <span className="text-primary">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    className={`${inputClass} text-left`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block mb-1.5 text-sm text-content"
                  >
                    آدرس کامل <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="استان، شهر، خیابان، پلاک و واحد"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-note"
                    className="block mb-1.5 text-sm text-content"
                  >
                    توضیحات سفارش (اختیاری)
                  </label>
                  <textarea
                    id="checkout-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="مثلاً ساعت مناسب تحویل"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm text-primary leading-relaxed"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "در حال ثبت سفارش…" : "تایید و ثبت نهایی سفارش"}
                </Button>
              </form>
            )}

            <Link
              href="/products"
              className="block mt-4 text-primary text-sm text-center hover:underline"
            >
              ادامه خرید
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
