"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Button from "@/app/components/Button";
import {
  ErrorBlock,
  Field,
  PageHeader,
  Spinner,
  Textarea,
  apiGet,
  apiSend,
  apiUpload,
  useToast,
} from "@/app/admin/_components/ui";

/**
 * A standalone image workbench: give it any picture, get an edited one back,
 * then take that image wherever you want it.
 *
 * Deliberately not tied to a product. The output is stored on our own uploads
 * volume and handed back as a permanent URL — the provider serves results from
 * a signed CDN path that expires, so a link straight to it would rot.
 */

const PRESETS = [
  {
    key: "in-hands",
    label: "در دست یک نفر",
    hint: "محصول در دست یک نفر، برای نشان دادن اندازه واقعی",
  },
  {
    key: "white-bg",
    label: "پس‌زمینه سفید",
    hint: "حذف پس‌زمینه و قرار دادن روی زمینه سفید استودیویی",
  },
  {
    key: "lifestyle",
    label: "در محیط واقعی",
    hint: "قرار دادن در یک فضای واقعی و ساده",
  },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];
type Phase = "idle" | "working" | "done";

/** Poll cadence and ceiling. Two minutes is normal; four is a stuck job. */
const POLL_MS = 3000;
const MAX_WAIT_MS = 4 * 60 * 1000;

export default function ImageToolPage() {
  const { show, node: toastNode } = useToast();

  const [source, setSource] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetKey>("in-hands");
  const [extra, setExtra] = useState("");
  const [note, setNote] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  // Cleared on unmount so a poll loop that outlives the page stops setting state.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const pickFile = useCallback(() => fileRef.current?.click(), []);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // allow re-picking the same file
    if (!file) return;

    const fd = new FormData();
    fd.append("files", file);
    setUploading(true);
    setError(null);
    try {
      const urls = await apiUpload<string[]>("/api/admin/uploads", fd);
      if (urls[0]) {
        setSource(urls[0]);
        setResult(null);
        setPhase("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تصویر");
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!source) return;
    alive.current = true;
    setPhase("working");
    setError(null);
    setResult(null);
    setElapsed(0);

    const started = Date.now();
    const tick = setInterval(() => {
      if (alive.current) setElapsed(Math.round((Date.now() - started) / 1000));
    }, 1000);

    try {
      const { id } = await apiSend<{ id: string }>("/api/admin/image-edit", "POST", {
        image: source,
        preset,
        extra,
        name: note,
      });

      for (;;) {
        if (!alive.current) return;
        if (Date.now() - started > MAX_WAIT_MS) {
          throw new Error("ساخت تصویر بیش از حد طول کشید؛ دوباره تلاش کنید");
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!alive.current) return;

        const res = await apiGet<{ status: string; error?: string }>(
          `/api/admin/image-edit/${id}`
        );
        if (res.status === "failed") throw new Error(res.error || "ساخت تصویر ناموفق بود");
        if (res.status !== "completed") continue;

        // Copy it onto our own volume straight away: the provider's URL is a
        // signed path that expires, so it is no use as "an image you can use
        // wherever you want".
        const stored = await apiSend<string>("/api/admin/image-edit/save", "POST", { id });
        if (!alive.current) return;
        setResult(stored);
        setPhase("done");
        return;
      }
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : "خطا در ساخت تصویر");
      setPhase("idle");
    } finally {
      clearInterval(tick);
    }
  }

  async function copyLink() {
    if (!result) return;
    const absolute = `${window.location.origin}${result}`;
    try {
      await navigator.clipboard.writeText(absolute);
      show("لینک تصویر کپی شد");
    } catch {
      // Clipboard access can be refused (permissions, insecure context) — say
      // so rather than silently doing nothing.
      show("کپی نشد؛ لینک را از نوار پایین بردارید", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ویرایش تصویر با هوش مصنوعی"
        subtitle="یک تصویر بدهید، نسخه ویرایش‌شده را بگیرید و هرجا خواستید استفاده کنید"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void handleFile(e)}
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------------------------ source + result */}
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-bold text-content">تصویر اصلی</span>
            <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-product-canvas">
              {source ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={source} alt="" className="h-full w-full object-contain p-3" />
              ) : (
                <button
                  type="button"
                  onClick={pickFile}
                  disabled={uploading}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm font-bold text-content-muted transition-colors hover:text-primary disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Spinner />
                      در حال بارگذاری…
                    </>
                  ) : (
                    <>
                      <span className="text-4xl leading-none">+</span>
                      انتخاب تصویر
                      <span className="text-xs font-normal text-content-subtle">
                        JPG، PNG یا WebP — حداکثر ۵ مگابایت
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
            {source && (
              <button
                type="button"
                onClick={pickFile}
                disabled={uploading || phase === "working"}
                className="mt-2 text-xs font-bold text-content-muted transition-colors hover:text-primary disabled:opacity-50"
              >
                انتخاب تصویر دیگر
              </button>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-bold text-content">نتیجه</span>
            <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-product-canvas">
              {phase === "working" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Spinner />
                  <p className="text-xs text-content-muted">در حال ساخت تصویر…</p>
                  {/* Elapsed seconds, so a two-minute wait never looks hung. */}
                  <p className="text-[11px] text-content-subtle">{elapsed} ثانیه</p>
                </div>
              )}
              {phase === "done" && result && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result} alt="" className="h-full w-full object-contain p-3" />
              )}
              {phase === "idle" && (
                <p className="px-6 text-center text-xs text-content-subtle">
                  هنوز تصویری ساخته نشده است
                </p>
              )}
            </div>

            {phase === "done" && result && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {/* Same-origin, so the download attribute is honoured. */}
                  <a
                    href={result}
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-hover"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                    دانلود تصویر
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-content transition-colors hover:border-primary hover:text-primary"
                  >
                    کپی لینک
                  </button>
                  <a
                    href={result}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-content transition-colors hover:border-primary hover:text-primary"
                  >
                    باز کردن در تب جدید
                  </a>
                </div>
                {/* The literal URL, so the link is recoverable even if the
                    clipboard is unavailable. */}
                <p className="rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-content-muted" dir="ltr">
                  {result}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------- controls */}
        <div className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-bold text-content">نوع ویرایش</span>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  aria-pressed={preset === p.key}
                  disabled={phase === "working"}
                  className={`block w-full rounded-xl border p-3 text-right transition-colors disabled:opacity-50 ${
                    preset === p.key
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <span className="block text-sm font-bold text-content">{p.label}</span>
                  <span className="mt-0.5 block text-xs text-content-muted">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <Field
            label="نام یا توضیح شیء (اختیاری)"
            hint="مثلاً «اکشن فیگور ۱۸ سانتی‌متری» — دانستن اندازه واقعی به مدل کمک می‌کند مقیاس را درست بسازد."
          >
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={phase === "working"}
              maxLength={200}
              placeholder="اکشن فیگور ۱۸ سانتی‌متری"
            />
          </Field>

          <Field
            label="توضیح دلخواه برای دستور (اختیاری)"
            hint="هر نکته‌ای که می‌خواهید به دستور اضافه شود — مثلاً «دست کودک باشد» یا «نور گرم‌تر». خود شیء تغییر نمی‌کند."
          >
            <Textarea
              rows={4}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              disabled={phase === "working"}
              maxLength={600}
              placeholder="مثلاً: نور گرم‌تر باشد و تصویر کمی مایل گرفته شود"
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button onClick={() => void generate()} disabled={!source || phase === "working"}>
              {phase === "working"
                ? "در حال ساخت…"
                : result
                  ? "ساخت دوباره"
                  : "ساخت تصویر"}
            </Button>
            {!source && (
              <span className="text-xs text-content-subtle">ابتدا یک تصویر انتخاب کنید</span>
            )}
          </div>

          <p className="text-xs text-content-subtle leading-relaxed">
            ساخت هر تصویر حدود دو دقیقه طول می‌کشد. تصویر ساخته‌شده روی همین سرور
            ذخیره می‌شود، پس لینک آن همیشه معتبر می‌ماند و می‌توانید در محصولات،
            بنرها یا هر جای دیگری از آن استفاده کنید.
          </p>
        </div>
      </div>

      {toastNode}
    </div>
  );
}
