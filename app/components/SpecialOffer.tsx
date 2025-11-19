import { toPersianNumber, formatPersianNumber } from "../utils/numbers";
import Button from "./Button";

export default function SpecialOffer() {
  return (
    <section className="py-16 px-4  border-t-2 border-black">
      <div className="max-w-7xl mx-auto">
        <div className=" border-2 border-black">
          <div className="grid md:grid-cols-2">
            <div className="bg-yellow-400 border-r-2 border-black p-12 flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                پیشنهاد ویژه هفته
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                مجموعه کامل اسباب‌بازی‌های آموزشی با تخفیف{" "}
                {toPersianNumber("40")} درصدی
              </p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {toPersianNumber("40")}%
                </span>
                <div>
                  <div className="text-2xl font-bold text-gray-900 line-through opacity-50">
                    {formatPersianNumber("2,500,000")} تومان
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPersianNumber("1,500,000")} تومان
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="lg" className="w-fit">
                خرید الان
              </Button>
            </div>
            <div className=" p-12 flex items-center justify-center">
              <div className="w-full h-64 bg-yellow-400 border-2 border-black flex items-center justify-center text-8xl">
                🎁
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
