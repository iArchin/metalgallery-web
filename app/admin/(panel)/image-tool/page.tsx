"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Button from "@/app/components/Button";
import GeneratingOverlay from "@/app/admin/_components/GeneratingOverlay";
import {
  ErrorBlock,
  Field,
  Modal,
  PageHeader,
  Spinner,
  Textarea,
  apiGet,
  apiSend,
  apiUpload,
  useToast,
} from "@/app/admin/_components/ui";

/**
 * A standalone image workbench: give it a picture, get an edited one back, then
 * take that image wherever you want it.
 *
 * Results are copied onto our own uploads volume the moment they are ready —
 * the provider serves them from a signed CDN path that expires, so a link
 * straight to it would rot within the day and could not be "an image you use
 * wherever you want".
 */

const PRESETS = [
  {
    key: "held-in-hand",
    label: "گرفته‌شده در یک دست",
    hint: "با یک دست گرفته شده، روی پس‌زمینه سفید",
  },
  {
    key: "on-open-palm",
    label: "روی کف دست باز",
    hint: "روی کف دستِ باز و رو به بالا قرار گرفته، روی پس‌زمینه سفید",
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

interface HistoryItem {
  url: string;
  preset: PresetKey;
  /** Epoch ms, for ordering and for the caption. */
  at: number;
}

/**
 * History lives in this browser, not the database.
 *
 * The images themselves are on the server and permanent; this is only the list
 * of which ones this tool made. A per-browser list is the honest scope for a
 * scratchpad — and it means no schema change for a feature whose value is the
 * files, not the index. Trade-off: it does not follow the admin to another
 * device, and clearing site data clears it.
 */
const HISTORY_KEY = "mg_admin_image_history_v1";
const HISTORY_MAX = 24;

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HistoryItem[]).filter((h) => h?.url) : [];
  } catch {
    return [];
  }
}

/**
 * Poll cadence and ceiling.
 *
 * A 1024px edit came back in about two minutes; 2048px — what this tool now
 * asks for — runs materially longer. The ceiling is generous rather than tight
 * because hitting it throws away a job that is still billing either way, and
 * the operator can cancel at any point from the overlay.
 */
const POLL_MS = 3000;
const MAX_WAIT_MS = 10 * 60 * 1000;

export default function ImageToolPage() {
  const { show, node: toastNode } = useToast();

  const [source, setSource] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetKey>("held-in-hand");
  const [extra, setExtra] = useState("");
  const [note, setNote] = useState("");

  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [preview, setPreview] = useState<HistoryItem | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  // Cleared on unmount so a poll loop that outlives the page stops setting state.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Read once on mount: localStorage is unavailable during SSR.
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const remember = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.url !== item.url)].slice(0, HISTORY_MAX);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // A full or blocked store must not lose the image that was just made.
      }
      return next;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* nothing to do */
    }
  };

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
      if (urls[0]) setSource(urls[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تصویر");
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!source) return;
    alive.current = true;
    setWorking(true);
    setError(null);
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

        const stored = await apiSend<string>("/api/admin/image-edit/save", "POST", { id });
        if (!alive.current) return;
        const item: HistoryItem = { url: stored, preset, at: Date.now() };
        remember(item);
        setWorking(false);
        // Straight into the preview: the result is the point of the wait, and
        // the history strip alone would bury it among older thumbnails.
        setPreview(item);
        return;
      }
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : "خطا در ساخت تصویر");
      setWorking(false);
    } finally {
      clearInterval(tick);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      show("لینک تصویر کپی شد");
    } catch {
      show("کپی نشد؛ لینک را از کادر پایین بردارید", "error");
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
        {/* ------------------------------------------------------- source */}
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
              disabled={uploading || working}
              className="mt-2 text-xs font-bold text-content-muted transition-colors hover:text-primary disabled:opacity-50"
            >
              انتخاب تصویر دیگر
            </button>
          )}
        </div>

        {/* ----------------------------------------------------- controls */}
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
                  disabled={working}
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
              disabled={working}
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
              disabled={working}
              maxLength={600}
              placeholder="مثلاً: نور گرم‌تر باشد و تصویر کمی مایل گرفته شود"
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button onClick={() => void generate()} disabled={!source || working}>
              ساخت تصویر
            </Button>
            {!source && (
              <span className="text-xs text-content-subtle">ابتدا یک تصویر انتخاب کنید</span>
            )}
          </div>

          <p className="text-xs text-content-subtle leading-relaxed">
            ساخت هر تصویر حدود دو دقیقه طول می‌کشد و خروجی با بالاترین کیفیت
            (۲۰۴۸×۲۰۴۸) ساخته می‌شود. تصویرها روی همین سرور ذخیره می‌شوند، پس
            لینکشان همیشه معتبر است.
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------- history */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-content">
            تصاویر ساخته‌شده
            {history.length > 0 && (
              <span className="mr-2 font-normal text-content-subtle">({history.length})</span>
            )}
          </h2>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs font-bold text-content-muted transition-colors hover:text-primary"
            >
              پاک کردن فهرست
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-content-muted">
            هنوز تصویری ساخته نشده است.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 3xl:grid-cols-8">
              {history.map((h) => (
                <button
                  key={h.url}
                  type="button"
                  onClick={() => setPreview(h)}
                  title={PRESETS.find((p) => p.key === h.preset)?.label}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-product-canvas transition-colors hover:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={h.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-content-subtle">
              این فهرست فقط روی همین مرورگر نگهداری می‌شود؛ خود تصویرها روی سرور
              باقی می‌مانند و لینکشان معتبر است.
            </p>
          </>
        )}
      </div>

      {/* --------------------------------------------------------- preview */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title="تصویر ساخته‌شده"
        wide
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-product-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt="" className="h-full w-full object-contain p-3" />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Same-origin, so the download attribute is honoured. */}
              <a
                href={preview.url}
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
                onClick={() => void copyLink(preview.url)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-content transition-colors hover:border-primary hover:text-primary"
              >
                کپی لینک
              </button>
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-content transition-colors hover:border-primary hover:text-primary"
              >
                باز کردن در تب جدید
              </a>
            </div>
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-content-muted" dir="ltr">
              {preview.url}
            </p>
          </div>
        )}
      </Modal>

      <GeneratingOverlay
        open={working}
        elapsed={elapsed}
        onCancel={() => {
          // Abandons the poll loop rather than the provider's job — the run
          // keeps billing either way, but the panel stops waiting on it.
          alive.current = false;
          setWorking(false);
        }}
      />

      {toastNode}
    </div>
  );
}
