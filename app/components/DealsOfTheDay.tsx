"use client";

import { useState, useEffect } from "react";
import Button from "./Button";

const products = [
  { id: 1, name: "Utricles At Torquent Qui", price: 12.00, originalPrice: 15.00, image: "🚛", rating: 5 },
  { id: 2, name: "Tinci Dunt Pharetra Sada", price: 10.00, originalPrice: 12.00, image: "🧱", rating: 5 },
  { id: 3, name: "Blue Dinosaur Plush", price: 18.00, originalPrice: 22.00, image: "🦕", rating: 5 },
  { id: 4, name: "Teddy Bear", price: 15.00, originalPrice: 20.00, image: "🧸", rating: 5 },
  { id: 5, name: "Panda Plush", price: 16.00, originalPrice: 19.00, image: "🐼", rating: 5 },
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Deals of the day</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="text-xs">Days</div>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-xs">Hours</div>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-xs">Minutes</div>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-xs">Seconds</div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="bg-gray-100 rounded-lg p-8 mb-4 flex items-center justify-center h-48">
                  <div className="text-6xl">{product.image}</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(product.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <Button variant="primary" size="sm" className="w-full">
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

