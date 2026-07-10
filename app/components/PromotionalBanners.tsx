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
    image: "/images/toy-promo.jpg",
    alt: "اسباب‌بازی آموزشی بلوک‌های ساختنی",
  },
  {
    id: 2,
    title: "واگن و ماشین سواری کودکان",
    discount: `و همین حالا ${toPersianNumber("20%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    image: "/images/toy-kids-3.jpg",
    alt: "ماشین سواری کودکان",
  },
  {
    id: 3,
    title: "اسباب‌بازی حرکتی برای کودکان",
    discount: `و همین حالا ${toPersianNumber("10%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    image: "/images/toy-kids-4.jpg",
    alt: "عروسک پولیشی سگ",
  },
];

export default function PromotionalBanners() {
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="site-container">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="group relative min-h-[220px] overflow-hidden rounded-2xl bg-surface-2 shadow-sm transition-colors"
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
                <h2 className="mb-1.5 text-lg font-bold leading-snug text-white sm:text-xl">
                  {banner.title}
                </h2>
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
