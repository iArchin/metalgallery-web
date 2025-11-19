import Button from "./Button";
import { toPersianNumber } from "../utils/numbers";

export default function DiscountBanner() {
  return (
    <section className="py-12 px-4 bg-teal-500">
      <div className="max-w-7xl mx-auto">
        <div className="bg-teal-500 rounded-lg p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-20">
            <div className="text-9xl">☁️</div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-6 md:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {toPersianNumber("45%")} تخفیف روی تمام اسباب‌بازی‌های فوق‌العاده ما
              </h2>
              <Button variant="secondary" size="lg">
                همین حالا خرید کنید
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-6xl">🧸</div>
              <div className="text-6xl">🧱</div>
              <div className="bg-white rounded-full px-4 py-2 text-teal-600 font-bold text-lg">
                {toPersianNumber("25%")} تخفیف
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

