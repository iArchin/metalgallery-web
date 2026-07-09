"use client";

import { useEffect, useRef, useState } from "react";
import { toPersianNumber } from "../utils/numbers";

interface Msg {
  id: number;
  from: "user" | "admin";
  text: string;
  at: string;
}

const CID_KEY = "mg_chat_cid";
const SEEN_KEY = "mg_chat_seen";

function loadCid(): string {
  try {
    let cid = localStorage.getItem(CID_KEY);
    if (!cid) {
      cid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      localStorage.setItem(CID_KEY, cid);
    }
    return cid;
  } catch {
    return `c-${Date.now()}`;
  }
}

export default function LiveChat({
  phone = "021-555-0112",
  email = "info@metalgallery.ir",
}: {
  phone?: string;
  email?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(0);
  const cidRef = useRef<string>("");
  const labelRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init conversation id + last-seen marker, and a friendly label if logged in.
  useEffect(() => {
    cidRef.current = loadCid();
    try {
      setLastSeenId(Number(localStorage.getItem(`${SEEN_KEY}_${cidRef.current}`)) || 0);
    } catch {
      /* ignore */
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        const phoneNum = j?.data?.customer?.phone;
        if (phoneNum) labelRef.current = phoneNum;
      })
      .catch(() => {});
  }, []);

  // Poll for new messages (drives the unread badge even while closed).
  useEffect(() => {
    if (!cidRef.current) return;
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/${cidRef.current}`, { cache: "no-store" });
        const json = await res.json();
        if (alive && json.ok) setMessages(json.data.messages as Msg[]);
      } catch {
        /* ignore */
      }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const maxId = messages.reduce((m, x) => Math.max(m, x.id), 0);
  const unread = messages.filter((m) => m.from === "admin" && m.id > lastSeenId).length;

  // Opening (or new messages while open) marks everything seen + scrolls down.
  useEffect(() => {
    if (!isOpen) return;
    if (maxId > lastSeenId) {
      setLastSeenId(maxId);
      try {
        localStorage.setItem(`${SEEN_KEY}_${cidRef.current}`, String(maxId));
      } catch {
        /* ignore */
      }
    }
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isOpen, maxId, lastSeenId]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    // Optimistic append.
    const optimistic: Msg = { id: maxId + 1, from: "user", text, at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cidRef.current, text, label: labelRef.current }),
      });
      const json = await res.json();
      if (json.ok) setMessages(json.data.messages as Msg[]);
    } catch {
      /* keep optimistic message */
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-primary-content p-4 rounded-full shadow-lg shadow-primary/30 transition-colors duration-300 z-50"
        aria-label="چت آنلاین با پشتیبانی"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full bg-content text-background text-xs font-extrabold border-2 border-background">
            {toPersianNumber(unread)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-88 max-w-[calc(100vw-3rem)] h-112 bg-surface rounded-2xl shadow-xl z-50 border border-border overflow-hidden flex flex-col">
          <div className="bg-primary text-primary-content p-4 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold">پشتیبانی آنلاین</h3>
              <p className="text-xs text-primary-content/80">معمولاً چند دقیقه‌ای پاسخ می‌دهیم</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-content/80 hover:text-primary-content transition-colors"
              aria-label="بستن"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="rounded-2xl bg-surface-2 px-3 py-2 text-sm text-content-muted">
              سلام! 👋 چطور می‌توانیم کمکتان کنیم؟ پیام خود را بنویسید.
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-primary text-primary-content"
                      : "bg-surface-2 text-content"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="p-3 border-t border-border flex items-center gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام شما…"
              className="flex-1 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary-hover disabled:opacity-50 transition-colors"
              aria-label="ارسال"
            >
              <svg className="w-5 h-5 -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          <div className="px-3 pb-3 -mt-1 shrink-0">
            <p className="text-[11px] text-content-subtle text-center">
              📞 {toPersianNumber(phone)} · ✉️ {email}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
