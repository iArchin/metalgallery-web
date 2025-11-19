"use client";

import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(event.target as Node) &&
        servicesMenuRef.current &&
        !servicesMenuRef.current.contains(event.target as Node)
      ) {
        setActiveMegaMenu(null);
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

  const megaMenuData = {
    خودروها: {
      types: {
        title: "نوع خودرو",
        items: [
          "سدان",
          "شاسی بلند (SUV)",
          "کامیونت",
          "وانت",
          "اسپرت",
          "کوپه",
          "هچ بک",
          "کراس اوور",
        ],
      },
      brands: {
        title: "برندها",
        items: [
          "پژو",
          "سمند",
          "پراید",
          "تیبا",
          "شاهین",
          "دنا",
          "رانا",
          "کوییک",
          "بی‌ام‌و",
          "بنز",
          "آئودی",
          "تویوتا",
        ],
      },
      priceRanges: {
        title: "محدوده قیمت",
        items: [
          "زیر ۱۰۰ میلیون",
          "۱۰۰-۳۰۰ میلیون",
          "۳۰۰-۵۰۰ میلیون",
          "۵۰۰-۸۰۰ میلیون",
          "بالای ۸۰۰ میلیون",
        ],
      },
      features: {
        title: "امکانات",
        items: [
          "دنده اتوماتیک",
          "دو دیفرانسیل",
          "شتاب بالا",
          "مصرف کم",
          "ایمنی بالا",
          "کیسه هوا",
        ],
      },
    },
    قطعات: {
      engine: {
        title: "قطعات موتور",
        items: ["پیستون", "شاتون", "یاتاقان", "واشر", "سوپاپ", "میل لنگ"],
      },
      body: {
        title: "بدنه و شاسی",
        items: ["درب", "کاپوت", "بامپر", "گلگیر", "فنر", "آمورته"],
      },
      electrical: {
        title: "برق و الکترونیک",
        items: ["باتری", "استارت", "دینام", "سیم کشی", "سنسور", "ECU"],
      },
      interior: {
        title: "داخلی خودرو",
        items: ["صندلی", "فرش", "پنل", "مانیتور", "صوتی", "تهویه"],
      },
    },
    لوازم: {
      accessories: {
        title: "اکسسوری",
        items: ["چراغ LED", "فیلم", "آنتن", "دزدگیر", "GPS", "دوربین"],
      },
      maintenance: {
        title: "نگهداری",
        items: [
          "روغن موتور",
          "فیلتر هوا",
          "باد لاستیک",
          "مایع خنک",
          "واکس",
          "شوینده",
        ],
      },
      tools: {
        title: "ابزار",
        items: ["جک", "چرخ", "آچار", "پیچ گوشتی", "موتور سیکلت", "کمپرسور"],
      },
    },
  };
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
      <nav className="bg-teal-600 text-white relative">
        <div className="max-w-7xl mx-auto ">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              {/* Mega Menu Categories */}
              <div ref={megaMenuRef} className="relative">
                <button
                  onMouseEnter={() => setActiveMegaMenu("categories")}
                  className="px-4 py-3 font-medium hover:bg-teal-700 flex items-center gap-2 rounded-lg transition-colors"
                >
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
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      activeMegaMenu === "categories" ? "rotate-180" : ""
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
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  خانه
                </a>
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  فروشگاه
                </a>
                <button
                  onMouseEnter={() => setActiveMegaMenu("services")}
                  className="hover:text-teal-200 transition-colors font-medium flex items-center gap-1"
                >
                  خدمات
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      activeMegaMenu === "services" ? "rotate-180" : ""
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
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  بلاگ
                </a>
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  درباره ما
                </a>
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  تماس با ما
                </a>
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  گالری
                </a>
                <a
                  href="#"
                  className="hover:text-teal-200 transition-colors font-medium"
                >
                  اخبار
                </a>
              </div>
            </div>

            {/* Categories Mega Menu Dropdown */}
            <div
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 max-w-7xl w-full bg-white shadow-2xl rounded-lg border border-gray-200 z-50 transition-all duration-300 ease-out ${
                activeMegaMenu === "categories"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("categories")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* خودروها Section */}
                <div className="p-6 border-l border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
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
                    خودروها
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.خودروها).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <a
                                key={index}
                                href="#"
                                className="text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
                              >
                                {item}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* قطعات Section */}
                <div className="p-6 border-l border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    قطعات
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.قطعات).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <a
                                key={index}
                                href="#"
                                className="text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
                              >
                                {item}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* لوازم Section */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    لوازم
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.لوازم).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <a
                                key={index}
                                href="#"
                                className="text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
                              >
                                {item}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Mega Menu */}
            <div
              ref={servicesMenuRef}
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 max-w-7xl w-full bg-white shadow-2xl rounded-lg border border-gray-200 z-50 transition-all duration-300 ease-out ${
                activeMegaMenu === "services"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("services")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                {/* تعمیر و نگهداری Section */}
                <div className="p-6 border-l border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    تعمیر و نگهداری
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      سرویس دوره‌ای
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تعمیرات برقی
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تعمیرات مکانیکی
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تعویض روغن و فیلتر
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تنظیم باد لاستیک
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      بررسی فنی
                    </a>
                  </div>
                </div>

                {/* خرید و فروش Section */}
                <div className="p-6 border-l border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    خرید و فروش
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      فروش نقدی
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      فروش اقساطی
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      خرید خودرو
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      ارزیابی خودرو
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      پیش خرید
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تعویض خودرو
                    </a>
                  </div>
                </div>

                {/* بیمه و مالی Section */}
                <div className="p-6 border-l border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    بیمه و مالی
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      بیمه بدنه
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      بیمه شخص ثالث
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      وام خودرو
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      لیزینگ
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      کارت اعتباری
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      مشاوره مالی
                    </a>
                  </div>
                </div>

                {/* خدمات ویژه Section */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    خدمات ویژه
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      مشاوره خرید
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تست درایو
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      گارانتی ویژه
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      خدمات اورژانسی
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      پشتیبانی ۲۴ ساعته
                    </a>
                    <a
                      href="#"
                      className="block text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded transition-colors"
                    >
                      تحویل رایگان
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
