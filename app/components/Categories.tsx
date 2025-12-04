"use client";

import Link from "next/link";

const categories = [
  { id: 1, name: "اسباب‌بازی و بازی", image: "🧸" },
  { id: 2, name: "اسباب‌بازی هوشمند", image: "🧱" },
  { id: 3, name: "اسباب‌بازی فضای باز", image: "🧩" },
  { id: 4, name: "اسباب‌بازی حرکتی", image: "🐴" },
  { id: 5, name: "اسباب‌بازی کنترلی", image: "🦕" },
];

export default function Categories() {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          دسته‌بندی‌های محبوب
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 justify-center">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="shrink-0 flex flex-col items-center cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center text-5xl mb-4 group-hover:border-teal-500 transition-colors shadow-md">
                {category.image}
              </div>
              <h3 className="text-base font-semibold text-gray-900 text-center">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
