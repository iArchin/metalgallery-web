"use client";

import { useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

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
