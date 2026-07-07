import Link from "next/link";
import { toPersianNumber } from "../utils/numbers";
import { toyImage } from "../utils/images";

const ageGroups = [
  {
    id: 1,
    age: `${toPersianNumber("0")}-${toPersianNumber("1")} سال`,
    keyword: "baby rattle toy",
    lock: 71,
    alt: "اسباب‌بازی جغجغه نوزاد",
  },
  {
    id: 2,
    age: `${toPersianNumber("1")}-${toPersianNumber("2")} سال`,
    keyword: "stacking toy",
    lock: 72,
    alt: "اسباب‌بازی حلقه‌های روی‌هم",
  },
  {
    id: 3,
    age: `${toPersianNumber("3")}-${toPersianNumber("4")} سال`,
    keyword: "building blocks toy",
    lock: 73,
    alt: "اسباب‌بازی بلوک‌های ساختنی",
  },
  {
    id: 4,
    age: `${toPersianNumber("0")}-${toPersianNumber("2")} سال`,
    keyword: "soft plush toy",
    lock: 74,
    alt: "عروسک پولیشی نرم",
  },
  {
    id: 5,
    age: `${toPersianNumber("4")}-${toPersianNumber("7")} سال`,
    keyword: "action figure",
    lock: 75,
    alt: "اکشن فیگور",
  },
  {
    id: 6,
    age: `${toPersianNumber("7")}-${toPersianNumber("10")} سال`,
    keyword: "board game toy",
    lock: 76,
    alt: "بازی رومیزی",
  },
  {
    id: 7,
    age: `${toPersianNumber("12") + "+"} سال`,
    keyword: "model kit toy",
    lock: 77,
    alt: "کیت ماکت مدل‌سازی",
  },
];

export default function ShopByAge() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3 text-content">
          بر اساس سن خرید کنید
        </h2>
        <p className="text-center text-sm sm:text-base text-content-muted mb-8 md:mb-12">
          اسباب‌بازی مناسب هر گروه سنی را کشف کنید
        </p>
        <div className="flex gap-5 sm:gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 justify-start sm:justify-center">
          {ageGroups.map((group) => (
            <Link
              key={group.id}
              href="/products"
              className="shrink-0 snap-start flex flex-col items-center group"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-surface-2 border-2 border-border group-hover:border-primary shadow-sm mb-3 sm:mb-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-active:scale-95">
                <img
                  src={toyImage(group.keyword, group.lock, 300, 300)}
                  alt={group.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-content text-center group-hover:text-primary transition-colors">
                {group.age}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
