"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatConversation } from "@/lib/types";
import { toPersianNumber } from "@/app/utils/numbers";
import {
  apiGet,
  apiSend,
  PageHeader,
  Card,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Spinner,
  Badge,
  useToast,
} from "@/app/admin/_components/ui";

interface ChatListResponse {
  conversations: ChatConversation[];
  unread: number;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { show, node: toastNode } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    try {
      const data = await apiGet<ChatListResponse>("/api/admin/chat");
      setConversations(data.conversations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت گفتگوها");
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(id: string) {
    try {
      const data = await apiGet<ChatConversation>(`/api/admin/chat/${id}`);
      setActive(data);
      // Reflect the now-read state in the list without a full refetch.
      setConversations((cs) =>
        cs.map((c) => (c.id === id ? { ...c, unreadForAdmin: 0 } : c))
      );
    } catch (err) {
      show(err instanceof Error ? err.message : "خطا در دریافت گفتگو", "error");
    }
  }

  // Poll the conversation list.
  useEffect(() => {
    void loadList();
    const t = setInterval(() => void loadList(), 5000);
    return () => clearInterval(t);
  }, []);

  // Poll the open conversation.
  useEffect(() => {
    if (!activeId) return;
    void loadConversation(activeId);
    const t = setInterval(() => void loadConversation(activeId), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, activeId]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const data = await apiSend<ChatConversation>(`/api/admin/chat/${activeId}`, "POST", { text });
      setActive(data);
      setReply("");
      void loadList();
    } catch (err) {
      show(err instanceof Error ? err.message : "ارسال پاسخ ناموفق بود", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader title="گفتگوی پشتیبانی" subtitle="پیام‌های چت آنلاین بازدیدکنندگان سایت" />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : conversations.length === 0 ? (
        <EmptyState title="گفتگویی وجود ندارد" subtitle="پیام‌های چت آنلاین اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Conversation list */}
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {conversations.map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-right px-4 py-3 transition-colors ${
                        activeId === c.id ? "bg-primary-soft" : "hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-content text-sm truncate" dir="ltr">
                          {c.label}
                        </span>
                        {c.unreadForAdmin > 0 && (
                          <Badge tone="danger">{toPersianNumber(c.unreadForAdmin)}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-content-muted truncate">
                        {last ? last.text : "—"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Active conversation */}
          <Card className="flex flex-col min-h-[70vh] max-h-[70vh]">
            {!active ? (
              <div className="flex-1 grid place-items-center text-content-muted text-sm">
                یک گفتگو را برای مشاهده انتخاب کنید
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-border shrink-0">
                  <span className="font-extrabold text-content" dir="ltr">
                    {active.label}
                  </span>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          m.from === "admin"
                            ? "bg-primary text-primary-content"
                            : "bg-surface-2 text-content"
                        }`}
                      >
                        <div>{m.text}</div>
                        <div
                          className={`mt-1 text-[10px] ${
                            m.from === "admin" ? "text-primary-content/70" : "text-content-subtle"
                          }`}
                        >
                          {fmtTime(m.at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendReply();
                  }}
                  className="p-3 border-t border-border flex items-center gap-2 shrink-0"
                >
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="پاسخ خود را بنویسید…"
                    className="flex-1 rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {sending && <Spinner />}
                    ارسال
                  </button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {toastNode}
    </div>
  );
}
