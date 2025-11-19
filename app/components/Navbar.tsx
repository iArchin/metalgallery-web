"use client";

import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [
    "همه دسته‌بندی‌ها",
    "اسباب‌بازی",
    "لباس کودکانه",
    "کفش کودکانه",
    "لوازم بهداشتی",
    "لوازم ایمنی",
    "کتاب‌های کودکانه",
  ];
  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto ">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">👶</span>
                </div>
                <span className="text-2xl font-bold text-teal-600">
                  بیبی‌مارت
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full flex">
                {/* Category Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 h-10 px-4 py-2 border border-gray-300 border-r-0 bg-gray-50 hover:bg-gray-100 rounded-r-full text-gray-700 text-sm min-w-[140px]"
                  >
                    {selectedCategory}
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-[140px] bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {categories.map((category, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="محصولات خود را جستجو کنید"
                    className="w-full h-10 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-right pr-12"
                  />
                  <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-gray-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm">۰۲۱-۱۲۳۴۵۶۷۸</span>
              </div>

              <button className="p-2 text-gray-700 hover:text-teal-600 relative">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              <button className="p-2 text-gray-700 hover:text-teal-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              <button className="p-2 text-gray-700 hover:text-teal-600 relative">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>

              <button className="p-2 text-gray-700 hover:text-teal-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto ">
          <div className="flex items-center h-12">
            <button className="py-2 font-medium hover:bg-teal-700 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              دسته‌بندی‌ها
            </button>
            <div className="flex items-center gap-6 ml-8">
              <a href="#" className="hover:text-teal-200 transition-colors">
                خانه
              </a>
              <a href="#" className="hover:text-teal-200 transition-colors">
                فروشگاه
              </a>
              <a href="#" className="hover:text-teal-200 transition-colors">
                صفحات
              </a>
              <a href="#" className="hover:text-teal-200 transition-colors">
                بلاگ
              </a>
              <a href="#" className="hover:text-teal-200 transition-colors">
                تماس با ما
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
