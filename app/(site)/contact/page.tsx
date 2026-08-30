import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { getSettings } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import { PHONE_KIND_LABELS, phoneHref, siteAddresses, sitePhones } from "@/lib/types";
import ContactIcon, { type ContactIconName } from "@/app/components/ContactIcon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "با فروشگاه اسباب‌بازی متال گالری در تماس باشید؛ تلفن، ایمیل، آدرس فروشگاه و فرم ارسال پیام.",
  openGraph: {
    title: "تماس با ما | متال گالری",
    description:
      "با فروشگاه اسباب‌بازی متال گالری در تماس باشید",
  },
};

export default async function ContactPage() {
  const s = await getSettings();

  const phones = sitePhones(s);
  const addresses = siteAddresses(s);

  // One card per contact entry. Keyed by a stable id rather than the title —
  // three cards all titled "تلفن" would otherwise collide as React keys.
  const infoCards: {
    key: string;
    title: string;
    value: string;
    dir: "ltr" | "rtl";
    icon: ContactIconName;
    href?: string;
  }[] = [
    ...phones.map((p) => ({
      key: `phone-${p.id}`,
      title: p.label.trim() || PHONE_KIND_LABELS[p.kind],
      value: toPersianNumber(p.value),
      dir: "ltr" as const,
      icon: p.kind as ContactIconName,
      href: phoneHref(p),
    })),
    {
      key: "email",
      title: "ایمیل",
      value: s.email,
      dir: "ltr" as const,
      icon: "email" as const,
      href: s.email ? `mailto:${s.email}` : undefined,
    },
    ...addresses.map((a) => ({
      key: `address-${a.id}`,
      title: a.label.trim() || "آدرس",
      value: toPersianNumber(a.value),
      dir: "rtl" as const,
      icon: "address" as const,
    })),
    {
      key: "hours",
      title: "ساعت کاری",
      value: toPersianNumber(s.workingHours),
      dir: "rtl" as const,
      icon: "hours" as const,
    },
  ].filter((c) => c.value);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10 md:mb-12">
        {infoCards.map((card) => {
          const body = (
            <>
              <span className="w-11 h-11 shrink-0 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <ContactIcon name={card.icon} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-content mb-1">{card.title}</h2>
                <p
                  dir={card.dir}
                  className={`text-sm text-content-muted wrap-break-word ${
                    card.dir === "ltr" ? "text-right" : ""
                  }`}
                >
                  {card.value}
                </p>
              </div>
            </>
          );
          const className =
            "bg-surface border border-border rounded-2xl p-5 shadow-sm transition-colors flex items-start gap-4";
          return card.href ? (
            <a key={card.key} href={card.href} className={`${className} hover:border-primary/50`}>
              {body}
            </a>
          ) : (
            <div key={card.key} className={className}>
              {body}
            </div>
          );
        })}
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
            <p className="text-content-muted font-medium">
              {addresses.length > 1 ? "شعبه‌های فروشگاه" : "نقشه فروشگاه"}
            </p>
            {addresses.map((a) => (
              <p key={a.id} className="text-sm text-content-subtle mt-1">
                {a.label.trim() && (
                  <span className="font-semibold text-content-muted">
                    {a.label} —{" "}
                  </span>
                )}
                {toPersianNumber(a.value)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
