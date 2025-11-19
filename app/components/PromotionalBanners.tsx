import Button from "./Button";
import { toPersianNumber } from "../utils/numbers";

const banners = [
  {
    id: 1,
    title: "اسباب‌بازی آموزشی برای کودکان",
    discount: `${toPersianNumber("15%")} تخفیف روی اسباب‌بازی و هدایای کودکان!`,
    buttonText: "همین حالا خرید کنید",
    bgColor: "bg-green-500",
    image: "🦕",
  },
  {
    id: 2,
    title: "واگن چرمی قهوه‌ای",
    discount: `و همین حالا ${toPersianNumber("20%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    bgColor: "bg-orange-500",
    image: "🚗",
  },
  {
    id: 3,
    title: "اسباب‌بازی حرکتی برای کودکان",
    discount: `و همین حالا ${toPersianNumber("10%")} تخفیف خود را دریافت کنید!`,
    buttonText: "همین حالا خرید کنید",
    bgColor: "bg-purple-500",
    image: "🐕",
  },
];

export default function PromotionalBanners() {
  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`${banner.bgColor} rounded-lg p-8 text-white relative overflow-hidden`}
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                <p className="text-lg mb-4 opacity-90">{banner.discount}</p>
                <Button variant="secondary" size="md">
                  {banner.buttonText}
                </Button>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-30">
                <div className="text-8xl">{banner.image}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

