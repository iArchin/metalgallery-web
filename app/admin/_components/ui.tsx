"use client";

import { useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { toPersianNumber } from "@/app/utils/numbers";

/* ----------------------------------------------------------- api helpers */

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "خطای سرور");
  return json.data as T;
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "خطای سرور");
  return json.data as T;
}

/** Multipart POST (file uploads); same {ok, data|error} envelope as apiSend. */
export async function apiUpload<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: form });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "خطای سرور");
  return json.data as T;
}

/* ------------------------------------------------------------ primitives */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-content">{title}</h1>
        {subtitle && <p className="text-sm text-content-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-content mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-content-subtle mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 cursor-pointer select-none"
      aria-pressed={checked}
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "right-0.5" : "right-[22px]"
          }`}
        />
      </span>
      {label && <span className="text-sm text-content">{label}</span>}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "danger";
}) {
  const tones = {
    neutral: "bg-surface-2 text-content-muted",
    primary: "bg-primary-soft text-primary",
    success: "bg-mint-soft text-mint",
    danger: "bg-primary text-primary-content",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<OrderStatus, "neutral" | "primary" | "success" | "danger"> = {
  pending: "primary",
  processing: "primary",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
      aria-label="در حال بارگذاری"
    />
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-content-muted">
      <Spinner />
      <span className="text-sm">در حال بارگذاری…</span>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-primary-soft text-primary px-4 py-3 text-sm font-bold">
      {message}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-16">
      <p className="font-bold text-content">{title}</p>
      {subtitle && <p className="text-sm text-content-muted mt-1">{subtitle}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ table */

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-right font-bold text-content-muted whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------- view-on-site link */

/**
 * "مشاهده در سایت" — opens the row's public page in a new tab.
 *
 * A plain anchor because neither `Button` nor anything else in this kit can
 * render one. Build `href` with `useAdminBase().storeHref(...)`: on the admin
 * subdomain a relative storefront path is rewritten back into the panel.
 *
 * Deactivated rows 404 on the storefront, so the control is shown but inert
 * with a tooltip saying why — hiding it would read as a missing feature.
 */
export function ViewOnSiteLink({
  href,
  active,
  inactiveTitle = "این مورد غیرفعال است و در سایت نمایش داده نمی‌شود",
}: {
  href: string;
  active: boolean;
  inactiveTitle?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors";
  const icon = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5h5m0 0v5m0-5l-7 7M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"
      />
    </svg>
  );

  if (!active) {
    return (
      <span
        className={`${base} text-content-subtle cursor-not-allowed`}
        title={inactiveTitle}
        aria-disabled
      >
        {icon}
        مشاهده در سایت
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="باز کردن در سایت (تب جدید)"
      className={`${base} text-content-muted hover:text-primary hover:bg-primary-soft`}
    >
      {icon}
      مشاهده در سایت
    </a>
  );
}

/* ------------------------------------------------------------- pagination */

/**
 * Page strip for a long admin table. Renders nothing for a single page, so a
 * caller can always mount it. Page numbers are Persian; `page` is 1-based.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  total,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Total row count, shown as "x of y" context. Optional. */
  total?: number;
}) {
  if (pageCount <= 1) return null;

  // A sliding window of at most five numbers around the current page, so the
  // strip stays the same width whether there are 3 pages or 300.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pageCount, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const arrow = (label: string, to: number, disabled: boolean, d: string) => (
    <button
      type="button"
      onClick={() => onChange(to)}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-content-muted transition-colors hover:text-primary hover:border-primary/50 disabled:opacity-40 disabled:pointer-events-none"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </button>
  );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && (
        <p className="text-xs text-content-muted">
          صفحه {toPersianNumber(page)} از {toPersianNumber(pageCount)} — مجموع{" "}
          {toPersianNumber(total)} مورد
        </p>
      )}
      <div className="flex items-center gap-1.5 ms-auto">
        {/* RTL: "previous" points right */}
        {arrow("صفحه قبل", page - 1, page <= 1, "M9 5l7 7-7 7")}
        {start > 1 && <span className="px-1 text-content-subtle">…</span>}
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-xl px-2.5 text-sm font-bold transition-colors ${
              n === page
                ? "bg-primary text-primary-content"
                : "border border-border text-content-muted hover:text-primary hover:border-primary/50"
            }`}
          >
            {toPersianNumber(n)}
          </button>
        ))}
        {end < pageCount && <span className="px-1 text-content-subtle">…</span>}
        {arrow("صفحه بعد", page + 1, page >= pageCount, "M15 19l-7-7 7-7")}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-surface border border-border rounded-2xl shadow-xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-extrabold text-content">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-primary hover:bg-surface-2 transition-colors"
            aria-label="بستن"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** Two-step destructive action button (click → confirm). */
export function ConfirmButton({
  onConfirm,
  label = "حذف",
  confirmLabel = "مطمئنم، حذف کن",
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
}) {
  const [arming, setArming] = useState(false);
  if (arming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          onClick={() => {
            setArming(false);
            onConfirm();
          }}
          className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-content hover:bg-primary-hover transition-colors"
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => setArming(false)}
          className="rounded-lg px-2 py-1.5 text-xs text-content-muted hover:text-content transition-colors"
        >
          انصراف
        </button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setArming(true)}
      className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary-soft transition-colors"
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ toast */

export function useToast() {
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const show = (text: string, tone: "success" | "error" = "success") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3000);
  };

  const node = toast ? (
    <div
      className={`fixed bottom-6 left-6 z-[60] rounded-2xl px-4 py-3 text-sm font-bold shadow-xl border ${
        toast.tone === "success"
          ? "bg-mint-soft text-mint border-mint/30"
          : "bg-primary-soft text-primary border-primary/30"
      }`}
      role="status"
    >
      {toast.text}
    </div>
  ) : null;

  return { show, node };
}
