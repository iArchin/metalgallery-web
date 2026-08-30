"use client";

/**
 * The waiting state for an AI image job.
 *
 * A full-screen modal rather than an inline spinner, for one practical reason:
 * the job takes about two minutes, and an operator who wanders off mid-run and
 * edits a field would have their work replaced when the result lands. Taking
 * the screen makes the wait the only thing happening.
 *
 * The aura is three stacked layers — a rotating conic ring, a breathing halo,
 * and a sweep across the rail — all transform/opacity so they composite on the
 * GPU and cost nothing while the request is in flight. Keyframes live in
 * globals.css alongside the site's other animations, and all three stop under
 * prefers-reduced-motion.
 */
export default function GeneratingOverlay({
  open,
  elapsed,
  onCancel,
}: {
  open: boolean;
  /** Seconds since the job started. */
  elapsed: number;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="در حال ساخت تصویر"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-2xl">
        <div className="relative mx-auto mb-6 grid h-36 w-36 place-items-center">
          {/* Halo — the soft colour bloom behind everything. */}
          <span
            className="animate-aura-breathe absolute inset-0 rounded-full bg-primary/30 blur-2xl"
            aria-hidden
          />
          {/* Ring — a conic sweep masked into a band, rotating. */}
          <span
            className="animate-aura-spin absolute inset-2 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--color-primary) 90deg, #AEDCEC 200deg, transparent 330deg)",
              // A ring, not a disc: punch the middle out so the icon reads.
              mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
            }}
            aria-hidden
          />
          {/* Core — still, so the eye has something to rest on. */}
          <span className="relative grid h-20 w-20 place-items-center rounded-full bg-surface-2 shadow-inner">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
          </span>
        </div>

        <h2 className="mb-1.5 text-lg font-extrabold text-content">در حال ساخت تصویر</h2>
        <p className="mb-5 text-sm text-content-muted leading-relaxed">
          این کار معمولاً حدود دو دقیقه طول می‌کشد. این صفحه را نبندید.
        </p>

        {/* An indeterminate rail: the provider reports no percentage, so a
            filling bar would be a lie. A sweep says "working" honestly. */}
        <div className="relative mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
          <span
            className="animate-aura-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary"
            aria-hidden
          />
        </div>

        <p className="mb-6 text-xs font-bold text-content-subtle" dir="rtl">
          {elapsed} ثانیه
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-content-muted transition-colors hover:border-primary hover:text-primary"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
