"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "./Button";
import { toPersianNumber, formatPersianNumber } from "../utils/numbers";

const products = [
  {
    id: 1,
    name: "اسباب‌بازی کامیون",
    price: 12.0,
    originalPrice: 15.0,
    image: "🚛",
    rating: 5,
  },
  {
    id: 2,
    name: "بلوک‌های ساختمانی",
    price: 10.0,
    originalPrice: 12.0,
    image: "🧱",
    rating: 5,
  },
  {
    id: 3,
    name: "دایناسور پلوش آبی",
    price: 18.0,
    originalPrice: 22.0,
    image: "🦕",
    rating: 5,
  },
  {
    id: 4,
    name: "خرسی پلوش",
    price: 15.0,
    originalPrice: 20.0,
    image: "🧸",
    rating: 5,
  },
  {
    id: 5,
    name: "پاندای پلوش",
    price: 16.0,
    originalPrice: 19.0,
    image: "🐼",
    rating: 5,
  },
];

export default function DealsOfTheDay() {
  const [timeLeft, setTimeLeft] = useState({
    days: 23,
    hours: 0,
    minutes: 10,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
            پیشنهادات روز
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-end gap-2">
              <div className="w-[60px] px-4 pt-3 pb-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(String(timeLeft.seconds).padStart(2, "0"))}
                </div>
                <div className="text-xs text-gray-600">ثانیه</div>
              </div>
              <span className="text-2xl font-bold pb-1">:</span>
              <div className="w-[60px] px-4 pt-3 pb-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(String(timeLeft.minutes).padStart(2, "0"))}
                </div>
                <div className="text-xs text-gray-600">دقیقه</div>
              </div>
              <span className="text-2xl font-bold pb-1">:</span>
              <div className="w-[60px] px-4 pt-3 pb-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(String(timeLeft.hours).padStart(2, "0"))}
                </div>
                <div className="text-xs text-gray-600">ساعت</div>
              </div>
              <span className="text-2xl font-bold pb-1">:</span>
              <div className="w-[60px] px-4 pt-3 pb-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(String(timeLeft.days).padStart(2, "0"))}
                </div>
                <div className="text-xs text-gray-600">روز</div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="shrink-0 w-64 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow block"
              >
                <div className="bg-gray-100 rounded-lg p-8 mb-4 flex items-center justify-center h-48">
                  <div className="text-6xl">{product.image}</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(product.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPersianNumber(product.price)} تومان
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPersianNumber(product.originalPrice)} تومان
                    </span>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Add to cart logic
                    }}
                  >
                    افزودن به سبد خرید
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
