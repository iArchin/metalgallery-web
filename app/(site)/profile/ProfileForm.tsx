"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toPersianNumber } from "@/app/utils/numbers";
import type { Customer } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

function osmEmbed(lat: number, lng: number): string {
  const d = 0.008;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/** Downscale a picked image to a small square-ish JPEG data URL (kept in the
 *  customer record, so no upload endpoint / file storage is needed). */
function resizeToDataUrl(file: File, max = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no-canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad-image"));
    };
    img.src = url;
  });
}

export default function ProfileForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? "");
  const [avatar, setAvatar] = useState(customer.avatar ?? "");
  const [full, setFull] = useState(customer.address?.full ?? "");
  const [postalCode, setPostalCode] = useState(customer.address?.postalCode ?? "");
  const [lat, setLat] = useState<number | null>(customer.address?.lat ?? null);
  const [lng, setLng] = useState<number | null>(customer.address?.lng ?? null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [locating, setLocating] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = (name.trim() || customer.phone).charAt(name.trim() ? 0 : 2);

  function flash(text: string, ok = true) {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 3000);
  }

  async function onPickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("فقط فایل تصویری مجاز است", false);
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setAvatar(dataUrl);
      setAvatarBroken(false);
    } catch {
      flash("پردازش تصویر ناموفق بود", false);
    } finally {
      setUploading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      flash("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند", false);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        flash("موقعیت شما ثبت شد");
      },
      () => {
        setLocating(false);
        flash("دسترسی به موقعیت امکان‌پذیر نبود", false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatar,
          address: {
            full,
            postalCode,
            lat: lat ?? undefined,
            lng: lng ?? undefined,
          },
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        flash(json.error ?? "ذخیره ناموفق بود", false);
        return;
      }
      flash("پروفایل ذخیره شد");
      // Let the navbar (avatar / name / notifications) refresh immediately.
      window.dispatchEvent(new Event("mg:profile-updated"));
      router.refresh();
    } catch {
      flash("خطا در ارتباط با سرور", false);
    } finally {
      setSaving(false);
    }
  }

  const hasLocation = lat != null && lng != null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) void save();
      }}
      className="space-y-5"
    >
      {/* Identity */}
      <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            {avatar.trim() && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.trim()}
                alt=""
                onError={() => setAvatarBroken(true)}
                className="h-16 w-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-soft text-primary grid place-items-center text-2xl font-extrabold">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-content">{name.trim() || "کاربر"}</div>
            <div className="text-xs text-content-muted" dir="ltr">
              {toPersianNumber(customer.phone)}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-bold text-content mb-1.5">نام و نام خانوادگی</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام خود را وارد کنید"
            className={inputClass}
          />
        </label>

        <div>
          <span className="block text-sm font-bold text-content mb-1.5">تصویر پروفایل</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-bold text-content cursor-pointer hover:border-primary transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? "در حال پردازش…" : "انتخاب تصویر"}
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
            </label>
            {avatar.trim() && (
              <button
                type="button"
                onClick={() => {
                  setAvatar("");
                  setAvatarBroken(false);
                }}
                className="text-sm text-content-muted hover:text-primary transition-colors"
              >
                حذف تصویر
              </button>
            )}
          </div>
          <span className="block text-xs text-content-subtle mt-1.5">
            تصویر به‌صورت خودکار فشرده می‌شود (حداکثر ۲۵۶ پیکسل).
          </span>
        </div>
      </section>

      {/* Address */}
      <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-extrabold text-content">آدرس تحویل</h2>

        <label className="block">
          <span className="block text-sm font-bold text-content mb-1.5">آدرس کامل</span>
          <textarea
            rows={3}
            value={full}
            onChange={(e) => setFull(e.target.value)}
            placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد"
            className={inputClass}
          />
        </label>

        <label className="block sm:max-w-xs">
          <span className="block text-sm font-bold text-content mb-1.5">کد پستی</span>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
            dir="ltr"
            inputMode="numeric"
            placeholder="۱۰ رقم"
            className={`${inputClass} tracking-widest`}
          />
        </label>

        {/* Map location */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-sm font-bold text-content">موقعیت روی نقشه</span>
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-content transition-colors disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locating ? "در حال یافتن…" : "ثبت موقعیت فعلی من"}
            </button>
          </div>

          {hasLocation ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="نقشه موقعیت"
                src={osmEmbed(lat as number, lng as number)}
                className="w-full h-56"
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-2 text-xs">
                <span className="text-content-muted" dir="ltr">
                  {toPersianNumber((lat as number).toFixed(5))}, {toPersianNumber((lng as number).toFixed(5))}
                </span>
                <span className="flex items-center gap-3">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline"
                  >
                    مشاهده روی نقشه
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setLat(null);
                      setLng(null);
                    }}
                    className="text-content-muted hover:text-primary"
                  >
                    حذف
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-8 text-center text-sm text-content-muted">
              برای ثبت دقیق آدرس، موقعیت خود را روی نقشه مشخص کنید.
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        {toast && (
          <span
            className={`text-sm font-bold ${toast.ok ? "text-mint" : "text-primary"}`}
          >
            {toast.text}
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="ms-auto inline-flex items-center gap-2 rounded-full bg-primary px-8 py-2.5 font-bold text-primary-content hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
