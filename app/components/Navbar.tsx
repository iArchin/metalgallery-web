"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { toyImage } from "../utils/images";
import { toPersianNumber, formatPersianNumber } from "../utils/numbers";
import { useCart } from "@/app/components/CartContext";

interface NavbarSettings {
  phone?: string;
  siteName?: string;
}

export default function Navbar({ settings }: { settings?: NavbarSettings }) {
  const { items, count, subtotal, remove } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const basketDropdownRef = useRef<HTMLDivElement>(null);
  const favoritesDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      if (
        openDropdown === "profile" &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "basket" &&
        basketDropdownRef.current &&
        !basketDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "favorites" &&
        favoritesDropdownRef.current &&
        !favoritesDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "notifications" &&
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const categories = [
    "همه دسته‌بندی‌ها",
    "اسباب‌بازی",
    "لباس کودکانه",
    "کفش کودکانه",
    "لوازم بهداشتی",
    "لوازم ایمنی",
    "کتاب‌های کودکانه",
  ];

  const navLinks = [
    { label: "خانه", href: "/" },
    { label: "فروشگاه", href: "/products" },
    { label: "بلاگ", href: "/blog" },
    { label: "گالری", href: "/gallery" },
    { label: "اخبار", href: "/news" },
    { label: "درباره ما", href: "/about" },
    { label: "تماس با ما", href: "/contact" },
  ];

  const megaMenuData = {
    toys: {
      playType: {
        title: "نوع بازی",
        items: [
          "اکشن فیگور",
          "عروسک و پولیشی",
          "ماشین و کنترلی",
          "لگو و ساختنی",
          "بازی فکری",
          "پازل",
          "رومیزی",
          "فضای باز",
        ],
      },
      brands: {
        title: "برندها",
        items: [
          "لگو",
          "پلی‌موبیل",
          "هاسبرو",
          "متل",
          "فیشر پرایس",
          "بندای",
        ],
      },
    },
    ageAndPrice: {
      age: {
        title: "رده سنی",
        items: ["۰-۲ سال", "۳-۵ سال", "۶-۸ سال", "۹-۱۲ سال", "نوجوان"],
      },
      price: {
        title: "قیمت",
        items: [
          "زیر ۲۰۰ هزار",
          "۲۰۰-۵۰۰ هزار",
          "۵۰۰ هزار تا ۱ میلیون",
          "بالای ۱ میلیون",
        ],
      },
    },
    themes: {
      characters: {
        title: "شخصیت‌ها و تم",
        items: [
          "سوپرقهرمان",
          "دایناسور",
          "حیوانات",
          "ماشین‌ها",
          "فضایی",
          "پرنسسی",
        ],
      },
      special: {
        title: "ویژه",
        items: [
          "پرفروش‌ترین‌ها",
          "جدیدترین‌ها",
          "تخفیف‌دار",
          "پیشنهاد ویژه",
        ],
      },
    },
  };
  return (
    <>
      {/* Top Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo.png"
                  alt="متال گالری"
                  width={80}
                  height={80}
                  className="w-16 sm:w-20 object-contain"
                />
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 border border-border rounded-full bg-surface overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary transition-shadow">
              <div className="relative w-full flex">
                {/* Category Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 h-10 px-4 py-2 border-l border-border bg-surface-2 hover:bg-surface-3 rounded-r-full text-content text-sm min-w-[140px] transition-colors"
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
                    <div className="absolute top-full right-0 mt-2 w-[160px] bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden p-1">
                      {categories.map((category, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-content rounded-xl hover:bg-surface-2 hover:text-primary transition-colors"
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
                    placeholder="اسباب‌بازی مورد نظر را جستجو کنید"
                    className="w-full h-10 px-4 py-2 rounded-l-full bg-surface text-content placeholder:text-content-subtle focus:outline-none text-right pr-12"
                  />
                  <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-subtle hover:text-primary transition-colors">
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
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 text-content-muted">
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
                <span className="text-sm">
                  {settings?.phone ? toPersianNumber(settings.phone) : "۰۲۱-۱۲۳۴۵۶۷۸"}
                </span>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications Dropdown */}
              <div
                ref={notificationsDropdownRef}
                className="relative hidden sm:block"
              >
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "notifications" ? null : "notifications"
                    )
                  }
                  className="p-2 text-content hover:text-primary active:text-primary relative transition-colors"
                >
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
                  <span className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
                    {toPersianNumber(3)}
                  </span>
                </button>
                {openDropdown === "notifications" && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-content text-right">
                        اعلان‌ها
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-border hover:bg-surface-2 cursor-pointer transition-colors">
                        <p className="text-sm text-content text-right">
                          سفارش شما تحویل داده شد
                        </p>
                        <p className="text-xs text-content-subtle text-right mt-1">
                          ۲ ساعت پیش
                        </p>
                      </div>
                      <div className="p-4 border-b border-border hover:bg-surface-2 cursor-pointer transition-colors">
                        <p className="text-sm text-content text-right">
                          اسباب‌بازی جدید به فروشگاه اضافه شد
                        </p>
                        <p className="text-xs text-content-subtle text-right mt-1">
                          ۵ ساعت پیش
                        </p>
                      </div>
                      <div className="p-4 border-b border-border hover:bg-surface-2 cursor-pointer transition-colors">
                        <p className="text-sm text-content text-right">
                          تخفیف ویژه برای شما
                        </p>
                        <p className="text-xs text-content-subtle text-right mt-1">
                          دیروز
                        </p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border">
                      <Link
                        href="/news"
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full text-sm text-primary hover:text-primary-hover text-center font-medium transition-colors"
                      >
                        مشاهده همه اعلان‌ها
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites Dropdown */}
              <div
                ref={favoritesDropdownRef}
                className="relative hidden sm:block"
              >
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "favorites" ? null : "favorites"
                    )
                  }
                  className="p-2 text-content hover:text-primary active:text-primary relative transition-colors"
                >
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
                  <span className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
                    {toPersianNumber(2)}
                  </span>
                </button>
                {openDropdown === "favorites" && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-content text-right">
                        علاقه‌مندی‌ها
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-border hover:bg-surface-2 cursor-pointer flex items-center gap-3 transition-colors">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
                          <img
                            src={toyImage("teddy bear", 21)}
                            alt="خرس عروسکی مخملی"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium text-content">
                            خرس عروسکی مخملی
                          </p>
                          <p className="text-sm text-content-muted mt-1">
                            ۲,۵۰۰,۰۰۰ تومان
                          </p>
                        </div>
                        <button className="text-primary hover:text-primary-hover transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4 border-b border-border hover:bg-surface-2 cursor-pointer flex items-center gap-3 transition-colors">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
                          <img
                            src={toyImage("action figure", 12)}
                            alt="اکشن فیگور قهرمان"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium text-content">
                            اکشن فیگور قهرمان
                          </p>
                          <p className="text-sm text-content-muted mt-1">
                            ۱,۸۰۰,۰۰۰ تومان
                          </p>
                        </div>
                        <button className="text-primary hover:text-primary-hover transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border">
                      <Link
                        href="/wishlist"
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full text-sm text-primary hover:text-primary-hover text-center font-medium transition-colors"
                      >
                        مشاهده همه علاقه‌مندی‌ها
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Basket Dropdown */}
              <div ref={basketDropdownRef} className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "basket" ? null : "basket"
                    )
                  }
                  className="p-2 text-content hover:text-primary active:text-primary relative transition-colors"
                >
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
                  {count > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
                      {toPersianNumber(count)}
                    </span>
                  )}
                </button>
                {openDropdown === "basket" && (
                  <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-content text-right">
                        سبد خرید
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="p-6 text-center text-sm text-content-muted">
                          سبد خرید خالی است
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.productId}
                            className="p-4 border-b border-border hover:bg-surface-2 flex items-center gap-3 transition-colors"
                          >
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
                              <img
                                src={toyImage(item.imageKeyword, item.imageLock)}
                                alt={item.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-medium text-content">
                                {item.name}
                              </p>
                              <p className="text-sm text-content-muted mt-1">
                                {toPersianNumber(item.quantity)} ×{" "}
                                {formatPersianNumber(item.price)} تومان
                              </p>
                            </div>
                            <button
                              onClick={() => remove(item.productId)}
                              aria-label={`حذف ${item.name} از سبد خرید`}
                              className="p-2 text-content-subtle hover:text-primary transition-colors"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-content-muted">جمع کل:</span>
                        <span className="text-lg font-bold text-content">
                          {formatPersianNumber(subtotal)} تومان
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/cart"
                          onClick={() => setOpenDropdown(null)}
                          className="flex-1 inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer rounded-full active:scale-95 bg-surface text-content border border-border hover:bg-surface-2 hover:border-border-strong px-4 py-2 text-sm"
                        >
                          مشاهده سبد خرید
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setOpenDropdown(null)}
                          className="flex-1 inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer rounded-full active:scale-95 bg-primary text-primary-content shadow-sm shadow-primary/30 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/40 px-4 py-2 text-sm"
                        >
                          تسویه حساب
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div ref={profileDropdownRef} className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "profile" ? null : "profile"
                    )
                  }
                  className="p-2 text-content hover:text-primary active:text-primary transition-colors"
                >
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
                {openDropdown === "profile" && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-primary"
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
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-sm font-semibold text-content">
                            کاربر مهمان
                          </p>
                          <p className="text-xs text-content-subtle">user@example.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                      >
                        پروفایل من
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                      >
                        سفارش‌های من
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                      >
                        آدرس‌ها
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                      >
                        تنظیمات
                      </a>
                      <div className="border-t border-border my-2"></div>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-primary hover:bg-primary-soft text-right transition-colors"
                      >
                        خروج از حساب کاربری
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 text-content hover:text-primary active:text-primary transition-colors"
                aria-label="باز کردن منو"
              >
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="اسباب‌بازی مورد نظر را جستجو کنید"
              className="w-full h-11 px-4 pr-11 rounded-full border border-border bg-surface-2 text-content text-sm placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary text-right transition-shadow"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle">
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
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 w-72 max-w-[85vw] h-full bg-surface border-l border-border overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-content">منو</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-content-muted hover:text-primary active:text-primary transition-colors"
                aria-label="بستن منو"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 border-b border-border text-content hover:text-primary active:text-primary font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-content-subtle mb-2">
                دسته‌بندی‌ها
              </h3>
              <div className="space-y-1">
                {megaMenuData.toys.playType.items.map((item, index) => (
                  <Link
                    key={index}
                    href="/products"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 px-2 rounded-lg text-sm text-content-muted hover:text-primary hover:bg-surface-2 active:bg-surface-2 transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-content-subtle mb-2">
                خدمات
              </h3>
              <div className="space-y-1">
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-2 rounded-lg text-sm text-content-muted hover:text-primary hover:bg-surface-2 active:bg-surface-2 transition-colors"
                >
                  رهگیری سفارش
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-2 rounded-lg text-sm text-content-muted hover:text-primary hover:bg-surface-2 active:bg-surface-2 transition-colors"
                >
                  مشاوره خرید
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-2 rounded-lg text-sm text-content-muted hover:text-primary hover:bg-surface-2 active:bg-surface-2 transition-colors"
                >
                  پشتیبانی ۲۴/۷
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-2 rounded-lg text-sm text-content-muted hover:text-primary hover:bg-surface-2 active:bg-surface-2 transition-colors"
                >
                  ضمانت اصالت کالا
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="hidden md:block bg-surface border-b border-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="hidden md:flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              {/* Mega Menu Categories */}
              <div ref={megaMenuRef} className="relative">
                <button
                  onMouseEnter={() => setActiveMegaMenu("categories")}
                  onClick={() =>
                    setActiveMegaMenu((prev) =>
                      prev === "categories" ? null : "categories"
                    )
                  }
                  className="px-4 py-2 font-bold text-content hover:bg-surface-2 hover:text-primary flex items-center gap-2 rounded-full transition-colors"
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
                <Link
                  href="/"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  خانه
                </Link>
                <Link
                  href="/products"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  فروشگاه
                </Link>
                <button
                  onMouseEnter={() => setActiveMegaMenu("services")}
                  onClick={() =>
                    setActiveMegaMenu((prev) =>
                      prev === "services" ? null : "services"
                    )
                  }
                  className="text-content hover:text-primary transition-colors font-medium flex items-center gap-1"
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
                <Link
                  href="/blog"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  بلاگ
                </Link>
                <Link
                  href="/about"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  درباره ما
                </Link>
                <Link
                  href="/contact"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  تماس با ما
                </Link>
                <Link
                  href="/gallery"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  گالری
                </Link>
                <Link
                  href="/news"
                  className="text-content-muted hover:text-primary transition-colors font-medium"
                >
                  اخبار
                </Link>
              </div>
            </div>

            {/* Categories Mega Menu Dropdown */}
            <div
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 max-w-7xl w-full bg-surface shadow-2xl rounded-3xl border border-border text-content z-50 transition-all duration-300 ease-out overflow-hidden ${
                activeMegaMenu === "categories"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("categories")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* اسباب‌بازی‌ها Section */}
                <div className="p-6 border-l border-border">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </span>
                    اسباب‌بازی‌ها
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.toys).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-content-muted mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <Link
                                key={index}
                                href="/products"
                                className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1 rounded-lg transition-colors"
                              >
                                {item}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* رده سنی و قیمت Section */}
                <div className="p-6 border-l border-border">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M9 12a3 3 0 100-6 3 3 0 000 6zm7 6a4 4 0 00-8 0m12-3a3 3 0 10-2-5.24"
                        />
                      </svg>
                    </span>
                    رده سنی و قیمت
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.ageAndPrice).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-content-muted mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <Link
                                key={index}
                                href="/products"
                                className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1 rounded-lg transition-colors"
                              >
                                {item}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* شخصیت‌ها و تم Section */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </span>
                    شخصیت‌ها و تم
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(megaMenuData.themes).map(
                      ([key, section]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-content-muted mb-2">
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map((item, index) => (
                              <Link
                                key={index}
                                href="/products"
                                className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1 rounded-lg transition-colors"
                              >
                                {item}
                              </Link>
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
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 max-w-7xl w-full bg-surface shadow-2xl rounded-3xl border border-border text-content z-50 transition-all duration-300 ease-out overflow-hidden ${
                activeMegaMenu === "services"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("services")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                {/* تحویل و ارسال Section */}
                <div className="p-6 border-l border-border">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM20 17a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16V6a1 1 0 00-1-1H3m10 11h6v-5m0 0l-3-3h-3m6 3H13"
                        />
                      </svg>
                    </span>
                    تحویل و ارسال
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      ارسال رایگان
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      تحویل سریع
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      رهگیری سفارش
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      تحویل درب منزل
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      ارسال به سراسر کشور
                    </a>
                  </div>
                </div>

                {/* ضمانت و مرجوعی Section */}
                <div className="p-6 border-l border-border">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </span>
                    ضمانت و مرجوعی
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      ۷ روز بازگشت
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      ضمانت اصالت
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      تعویض کالا
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      بازگشت وجه
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      ضمانت ایمنی و استاندارد
                    </a>
                  </div>
                </div>

                {/* هدیه و باشگاه Section */}
                <div className="p-6 border-l border-border">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-7-4v16"
                        />
                      </svg>
                    </span>
                    هدیه و باشگاه
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      بسته‌بندی هدیه
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      کارت هدیه
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      باشگاه مشتریان
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      امتیازات و جوایز
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      پیشنهاد تولد
                    </a>
                  </div>
                </div>

                {/* پشتیبانی Section */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-content mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary">
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </span>
                    پشتیبانی
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/contact"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      مشاوره خرید
                    </a>
                    <a
                      href="/contact"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      راهنمای سنی
                    </a>
                    <a
                      href="/contact"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      پشتیبانی ۲۴/۷
                    </a>
                    <a
                      href="/contact"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      سوالات متداول
                    </a>
                    <a
                      href="/about"
                      className="block text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-3 py-2 rounded-xl transition-colors"
                    >
                      تماس با کارشناسان
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
