"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/app/components/Button";
import { ErrorBlock, Field, Modal, Spinner, Textarea, apiGet, apiSend } from "./ui";

/**
 * "ویرایش با هوش مصنوعی" — sends one uploaded product photo to the image model
 * and offers the result back as a new photo for the same product.
 *
 * The job is asynchronous and takes about a minute, so this polls. Three things
 * that matter for an operator watching a spinner that long: elapsed time is
 * shown so it never looks hung, the poll gives up rather than spinning forever,
 * and the run is abandoned cleanly if the modal is closed mid-flight.
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
    hint: "حذف پس‌زمینه و قرار دادن محصول روی زمینه سفید استودیویی",
  },
  {
    key: "lifestyle",
    label: "در محیط واقعی",
    hint: "محصول در یک فضای واقعی و ساده",
  },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];
type Phase = "idle" | "working" | "done" | "error";

/** Poll cadence and ceiling. A minute is normal; four is a stuck job. */
const POLL_MS = 3000;
const MAX_WAIT_MS = 4 * 60 * 1000;

export default function ImageEditModal({
  open,
  onClose,
  image,
  productName,
  specifications,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  /** The source photo, an /api/uploads/... path already on the product. */
  image: string;
  productName?: string;
  specifications?: Record<string, string>;
  /** Called with the stored path of the generated photo. */
  onAccept: (url: string) => void;
}) {
  const [preset, setPreset] = useState<PresetKey>("in-hands");
  const [extra, setExtra] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  // Set to false on close so an in-flight poll loop stops touching state.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setResultId(null);
    setPreviewUrl(null);
    setElapsed(0);
    setSaving(false);
  }, []);

  const close = () => {
    alive.current = false;
    reset();
    onClose();
  };

  async function run() {
    alive.current = true;
    setPhase("working");
    setError(null);
    setPreviewUrl(null);
    setResultId(null);
    setElapsed(0);

    const started = Date.now();
    const tick = setInterval(() => {
      if (alive.current) setElapsed(Math.round((Date.now() - started) / 1000));
    }, 1000);

    try {
      const { id } = await apiSend<{ id: string }>("/api/admin/image-edit", "POST", {
        image,
        preset,
        extra,
        name: productName,
        specifications,
      });

      for (;;) {
        if (!alive.current) return;
        if (Date.now() - started > MAX_WAIT_MS) {
          throw new Error("ساخت تصویر بیش از حد طول کشید؛ دوباره تلاش کنید");
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!alive.current) return;

        const res = await apiGet<{ status: string; imageUrl?: string; error?: string }>(
          `/api/admin/image-edit/${id}`
        );
        if (res.status === "completed" && res.imageUrl) {
          if (!alive.current) return;
          setResultId(id);
          setPreviewUrl(res.imageUrl);
          setPhase("done");
          return;
        }
        if (res.status === "failed") {
          throw new Error(res.error || "ساخت تصویر ناموفق بود");
        }
      }
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : "خطا در ساخت تصویر");
      setPhase("error");
    } finally {
      clearInterval(tick);
    }
  }

  async function accept() {
    if (!resultId) return;
    setSaving(true);
    try {
      const url = await apiSend<string>("/api/admin/image-edit/save", "POST", { id: resultId });
      onAccept(url);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره تصویر");
      setPhase("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="ویرایش تصویر با هوش مصنوعی" wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-content">تصویر فعلی</span>
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-product-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-contain p-2" />
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-content">نتیجه</span>
            <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-border bg-product-canvas">
              {phase === "working" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Spinner />
                  <p className="text-xs text-content-muted">در حال ساخت تصویر…</p>
                  {/* Elapsed time, so a long wait never looks like a hang. */}
                  <p className="text-[11px] text-content-subtle">{elapsed} ثانیه</p>
                </div>
              )}
              {phase === "done" && previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="h-full w-full object-contain p-2" />
              )}
              {(phase === "idle" || phase === "error") && (
                <p className="px-4 text-center text-xs text-content-subtle">
                  {phase === "error" ? "ساخت نشد" : "هنوز ساخته نشده است"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-content">نوع ویرایش</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                aria-pressed={preset === p.key}
                disabled={phase === "working"}
                className={`rounded-xl border p-3 text-right transition-colors disabled:opacity-50 ${
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
          label="توضیح دلخواه (اختیاری)"
          hint="هر نکته‌ای که می‌خواهید به دستور اضافه شود — مثلاً «دست کودک باشد» یا «پس‌زمینه آبی روشن». خود محصول تغییر نمی‌کند."
        >
          <Textarea
            rows={3}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            disabled={phase === "working"}
            maxLength={600}
            placeholder="مثلاً: نور گرم‌تر باشد و محصول کمی مایل گرفته شود"
          />
        </Field>

        {/* ErrorBlock, not a hand-rolled box: there is no `danger` colour token
            in this design system, so bg-danger/text-danger would have compiled
            to nothing and shown the message unstyled. */}
        {error && <ErrorBlock message={error} />}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" size="sm" onClick={close} disabled={saving}>
            بستن
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void run()}
            disabled={phase === "working" || saving}
          >
            {phase === "working"
              ? "در حال ساخت…"
              : phase === "done" || phase === "error"
                ? "ساخت دوباره"
                : "ساخت تصویر"}
          </Button>
          <Button size="sm" onClick={() => void accept()} disabled={phase !== "done" || saving}>
            {saving ? "در حال ذخیره…" : "افزودن به تصاویر محصول"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
