import Link from "next/link";
import { toPersianNumber } from "../utils/numbers";

const ageGroups = [
  {
    id: 1,
    age: `${toPersianNumber("0")}-${toPersianNumber("1")} سال`,
    image: "/images/toy-kids-1.jpg",
    alt: "اسباب‌بازی جغجغه نوزاد",
  },
  {
    id: 2,
    age: `${toPersianNumber("1")}-${toPersianNumber("2")} سال`,
    image: "/images/toy-kids-2.jpg",
    alt: "اسباب‌بازی حلقه‌های روی‌هم",
  },
  {
    id: 3,
    age: `${toPersianNumber("3")}-${toPersianNumber("4")} سال`,
    image: "/images/toy-kids-3.jpg",
    alt: "اسباب‌بازی بلوک‌های ساختنی",
  },
  {
    id: 4,
    age: `${toPersianNumber("0")}-${toPersianNumber("2")} سال`,
    image: "/images/toy-kids-4.jpg",
    alt: "عروسک پولیشی نرم",
  },
  {
    id: 5,
    age: `${toPersianNumber("4")}-${toPersianNumber("7")} سال`,
    image: "/images/toy-kids-5.jpg",
    alt: "اکشن فیگور",
  },
  {
    id: 6,
    age: `${toPersianNumber("7")}-${toPersianNumber("10")} سال`,
    image: "/images/toy-hero.jpg",
    alt: "بازی رومیزی",
  },
  {
    id: 7,
    age: `${toPersianNumber("12") + "+"} سال`,
    image: "/images/toy-banner.jpg",
    alt: "کیت ماکت مدل‌سازی",
  },
];

export default function ShopByAge() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-surface-2 border-2 border-border group-hover:border-primary shadow-sm mb-3 sm:mb-4 transition-all">
                <img
                  src={group.image}
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
