import type { Metadata } from "next";
import type { ReactNode } from "react";
import ContactForm from "./ContactForm";
import { getSettings } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تماس با ما | متال گالری",
  description:
    "با فروشگاه اسباب‌بازی متال گالری در تماس باشید؛ تلفن، ایمیل، آدرس فروشگاه و فرم ارسال پیام.",
};

const icons: Record<string, ReactNode> = {
  phone: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  ),
  email: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  address: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  hours: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export default async function ContactPage() {
  const s = await getSettings();

  const infoCards = [
    {
      title: "تلفن",
      value: toPersianNumber(s.phone),
      dir: "ltr" as const,
      icon: icons.phone,
    },
    {
      title: "ایمیل",
      value: s.email,
      dir: "ltr" as const,
      icon: icons.email,
    },
    {
      title: "آدرس",
      value: toPersianNumber(s.address),
      dir: "rtl" as const,
      icon: icons.address,
    },
    {
      title: "ساعت کاری",
      value: toPersianNumber(s.workingHours),
      dir: "rtl" as const,
      icon: icons.hours,
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="max-w-2xl mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content mb-3">
          تماس با ما
        </h1>
        <p className="text-sm sm:text-base text-content-muted leading-7">
          سوالی درباره محصولات، سفارش یا ارسال دارید؟ تیم پشتیبانی متال گالری
          آماده پاسخگویی به شماست. از طریق راه‌های ارتباطی زیر با ما در تماس
          باشید یا فرم زیر را پر کنید تا در کوتاه‌ترین زمان با شما تماس
          بگیریم.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 md:mb-12">
        {infoCards.map((card) => (
          <div
            key={card.title}
            className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-start gap-4"
          >
            <span className="w-11 h-11 shrink-0 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              {card.icon}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-content mb-1">
                {card.title}
              </h2>
              <p
                dir={card.dir}
                className={`text-sm text-content-muted wrap-break-word ${
                  card.dir === "ltr" ? "text-right" : ""
                }`}
              >
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ContactForm />
        <div className="bg-surface-2 border border-border rounded-2xl min-h-[280px] flex items-center justify-center p-6">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-content-subtle"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
              />
            </svg>
            <p className="text-content-muted font-medium">نقشه فروشگاه</p>
            <p className="text-sm text-content-subtle mt-1">
              {toPersianNumber(s.address)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
