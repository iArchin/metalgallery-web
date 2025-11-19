import { toPersianNumber } from "../utils/numbers";

const perks = [
  {
    id: 1,
    icon: "📦",
    title: "ضمانت بازگشت وجه",
    color: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: 2,
    icon: "🔒",
    title: "۱۰۰% ایمن و مطمئن",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: 3,
    icon: "🎧",
    title: "همیشه آنلاین ۲۴/۷",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: 4,
    icon: "🎁",
    title: `${toPersianNumber("20%")} تخفیف با عضویت`,
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

export default function ImagePerks() {
  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {perks.map((perk) => (
            <div
              key={perk.id}
              className={`${perk.color} rounded-lg p-6 flex items-center gap-4`}
            >
              <div className={`text-4xl ${perk.iconColor}`}>{perk.icon}</div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">
                  {perk.id === 1 && "بازگشت و بازپرداخت"}
                  {perk.id === 2 && "پرداخت امن"}
                  {perk.id === 3 && "پشتیبانی با کیفیت"}
                  {perk.id === 4 && "پیشنهادات روزانه"}
                </div>
                <div className="text-xs text-gray-600">{perk.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
