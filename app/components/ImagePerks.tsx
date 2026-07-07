import { toPersianNumber } from "../utils/numbers";

const perks = [
  {
    id: 1,
    icon: "📦",
    heading: "بازگشت و بازپرداخت",
    title: "ضمانت بازگشت وجه",
  },
  {
    id: 2,
    icon: "🔒",
    heading: "پرداخت امن",
    title: "۱۰۰% ایمن و مطمئن",
  },
  {
    id: 3,
    icon: "🎧",
    heading: "پشتیبانی با کیفیت",
    title: "همیشه آنلاین ۲۴/۷",
  },
  {
    id: 4,
    icon: "🎁",
    heading: "پیشنهادات روزانه",
    title: `${toPersianNumber("20%")} تخفیف با عضویت`,
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
              className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary text-xl sm:text-2xl">
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
