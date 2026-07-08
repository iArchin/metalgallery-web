import { toPersianNumber } from "../utils/numbers";

const perks = [
  {
    id: 1,
    heading: "بازگشت و بازپرداخت",
    title: "ضمانت بازگشت وجه",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 2,
    heading: "پرداخت امن",
    title: "۱۰۰% ایمن و مطمئن",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: 3,
    heading: "پشتیبانی با کیفیت",
    title: "همیشه آنلاین ۲۴/۷",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 4,
    heading: "پیشنهادات روزانه",
    title: `${toPersianNumber("20%")} تخفیف با عضویت`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-7-4v16" />
      </svg>
    ),
  },
];

export default function ImagePerks() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {perks.map((perk) => (
            <div
              key={perk.id}
              className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm transition-colors"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {perk.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-content mb-0.5">
                  {perk.heading}
                </div>
                <div className="text-xs text-content-muted">{perk.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
