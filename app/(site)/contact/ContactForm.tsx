"use client";

import { useState, FormEvent } from "react";
import Button from "@/app/components/Button";

const inputStyles =
  "w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm sm:text-base text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setSubmitted(true);
      } else {
        setError(
          json?.error || "ارسال پیام با خطا مواجه شد؛ لطفا دوباره تلاش کنید."
        );
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ لطفا دوباره تلاش کنید.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 h-full flex items-center justify-center">
        <div className="bg-mint-soft text-mint rounded-2xl p-6 sm:p-8 text-center w-full">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-bold text-lg mb-2">
            پیام شما با موفقیت ارسال شد
          </p>
          <p className="text-sm">
            از تماس شما سپاسگزاریم؛ کارشناسان ما در اسرع وقت پاسخ خواهند داد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4"
    >
      <h2 className="text-lg sm:text-xl font-bold text-content mb-1">
        ارسال پیام
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-content-muted mb-1.5"
          >
            نام
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام و نام خانوادگی"
            required
            className={inputStyles}
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-content-muted mb-1.5"
          >
            ایمیل
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            dir="ltr"
            className={`${inputStyles} text-left placeholder:text-right`}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-content-muted mb-1.5"
        >
          موضوع
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="موضوع پیام شما"
          required
          className={inputStyles}
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-content-muted mb-1.5"
        >
          پیام
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="پیام خود را اینجا بنویسید..."
          required
          rows={5}
          className={`${inputStyles} resize-y min-h-[120px]`}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-coral leading-6">
          {error}
        </p>
      )}
      <div className="mt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={sending}
          className="w-full sm:w-auto"
        >
          {sending ? "در حال ارسال..." : "ارسال پیام"}
          <svg
            className="w-4 h-4 rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </Button>
      </div>
    </form>
  );
}
