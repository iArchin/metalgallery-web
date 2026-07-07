import Link from "next/link";
import Button from "./Button";
import { toPersianNumber } from "../utils/numbers";
import { toyImage } from "../utils/images";

const banners = [
  {
    id: 1,
    title: "اسباب‌بازی آموزشی برای کودکان",
    discount: `${toPersianNumber("15%")} تخفیف روی اسباب‌بازی و هدایای کودکان!`,
    buttonText: "همین حالا خرید کنید",
    image: toyImage("lego building blocks educational toy", 31),
    alt: "اسباب‌بازی آموزشی بلوک‌های ساختنی",
  },
  {
    id: 2,
    title: "واگن و ماشین سواری کودکان",
    discount: `و همین حالا ${toPersianNumber("20%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    image: toyImage("ride on toy car kids", 43),
    alt: "ماشین سواری کودکان",
  },
  {
    id: 3,
    title: "اسباب‌بازی حرکتی برای کودکان",
    discount: `و همین حالا ${toPersianNumber("10%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    image: toyImage("plush toy puppy dog", 21),
    alt: "عروسک پولیشی سگ",
  },
];

export default function PromotionalBanners() {
  return (
    <section className="bg-background px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="group relative min-h-[220px] overflow-hidden rounded-2xl bg-surface-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* real toy photo */}
              <img
                src={banner.image}
                alt={banner.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* neutral readability overlay */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/10" />

              {/* content anchored to the bottom */}
              <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-5 sm:p-6">
                <h3 className="mb-1.5 text-lg font-bold leading-snug text-white sm:text-xl">
                  {banner.title}
                </h3>
                <p className="mb-4 text-sm text-white/85">{banner.discount}</p>
                <Link href="/products" className="self-start">
                  <Button variant="secondary" size="sm">
                    {banner.buttonText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
