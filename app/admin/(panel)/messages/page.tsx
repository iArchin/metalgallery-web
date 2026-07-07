"use client";

import { useEffect, useState } from "react";
import type { ContactMessage } from "@/lib/types";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  PageHeader,
  Card,
  Badge,
  ConfirmButton,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  useToast,
} from "@/app/admin/_components/ui";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { show, node: toastNode } = useToast();

  async function load() {
    try {
      setError(null);
      const data = await apiGet<ContactMessage[]>("/api/messages");
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleRead(m: ContactMessage) {
    try {
      await apiSend<ContactMessage>(`/api/messages/${m.id}`, "PUT", { read: !m.read });
      show(m.read ? "پیام به حالت خوانده‌نشده برگشت" : "پیام خوانده‌شده علامت خورد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در تغییر وضعیت", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiSend<null>(`/api/messages/${id}`, "DELETE");
      show("پیام حذف شد");
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در حذف", "error");
    }
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div>
      <PageHeader
        title="پیام‌های کاربران"
        subtitle={
          unreadCount > 0
            ? `${toPersianNumber(unreadCount)} پیام خوانده‌نشده دارید`
            : "همه پیام‌ها خوانده شده‌اند"
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : messages.length === 0 ? (
        <EmptyState title="پیامی ثبت نشده است" subtitle="پیام‌های فرم تماس با ما اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id} className={`p-4 sm:p-5 ${m.read ? "" : "border-primary"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-content">{m.name}</span>
                    <span className="text-xs text-content-muted" dir="ltr">
                      {m.email}
                    </span>
                    {!m.read && <Badge tone="primary">جدید</Badge>}
                  </div>
                  <p className="font-bold text-sm text-content mt-2">{m.subject}</p>
                  <p className="text-sm text-content-muted mt-1.5 leading-7 whitespace-pre-line">
                    {m.message}
                  </p>
                  <p className="text-xs text-content-subtle mt-3">{formatDate(m.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => void toggleRead(m)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-content-muted hover:text-primary hover:bg-primary-soft transition-colors"
                  >
                    {m.read ? "علامت به‌عنوان خوانده‌نشده" : "علامت به‌عنوان خوانده‌شده"}
                  </button>
                  <ConfirmButton onConfirm={() => void handleDelete(m.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {toastNode}
    </div>
  );
}
