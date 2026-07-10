"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { toyImage, productImage } from "../utils/images";
import { toPersianNumber, formatPersianNumber } from "../utils/numbers";
import { useCart } from "@/app/components/CartContext";
import type { Product } from "@/lib/types";

interface NavbarSettings {
  phone?: string;
  siteName?: string;
}

/** Persian relative time, e.g. "۲ ساعت پیش". Client-only (avoids SSR skew). */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "لحظاتی پیش";
  if (m < 60) return `${toPersianNumber(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toPersianNumber(h)} ساعت پیش`;
  return `${toPersianNumber(Math.floor(h / 24))} روز پیش`;
}

export default function Navbar({
  settings,
  categories = [],
}: {
  settings?: NavbarSettings;
  categories?: { id: number; name: string }[];
}) {
  const { items, count, subtotal, remove } = useCart();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [customer, setCustomer] = useState<
    { phone: string; name: string; avatar?: string } | null
  >(null);
  const [notifications, setNotifications] = useState<
    { id: number; text: string; at: string }[]
  >([]);
  const [notifUnread, setNotifUnread] = useState(0);

  // Load the logged-in customer + their notifications. Re-run on route change,
  // on window focus, and after a profile edit (custom event) so the navbar
  // avatar/name/badges stay fresh without a full reload.
  const refreshAccount = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setCustomer(j.data.customer ?? null);
      })
      .catch(() => {});
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setNotifications(j.data.items ?? []);
          setNotifUnread(j.data.unread ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshAccount();
  }, [pathname, refreshAccount]);

  useEffect(() => {
    const onUpdate = () => refreshAccount();
    window.addEventListener("mg:profile-updated", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener("mg:profile-updated", onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, [refreshAccount]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "user" }),
      });
    } catch {
      // ignore
    }
    setCustomer(null);
    setOpenDropdown(null);
    window.location.reload();
  };

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Instant search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.ok) {
        setSearchResults(json.data);
        setSearchOpen(json.data.length > 0);
      }
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(value), 150);
  };

  // Close results on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  // Live wishlist badge: the wishlist lives in localStorage (mg_wishlist_v1,
  // owned by WishlistClient). Re-read on every route change (the navbar stays
  // mounted across SPA navigations) and on cross-tab storage events.
  useEffect(() => {
    const readCount = () => {
      try {
        const raw = localStorage.getItem("mg_wishlist_v1");
        const parsed = raw ? JSON.parse(raw) : [];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };
    readCount();
    window.addEventListener("storage", readCount);
    window.addEventListener("focus", readCount);
    return () => {
      window.removeEventListener("storage", readCount);
      window.removeEventListener("focus", readCount);
    };
  }, [pathname]);

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

  // Real, admin-managed categories (passed from the server layout), plus the
  // "all" option. Selecting one navigates to the filtered shop.
  const categoryOptions = [{ id: 0, name: "همه دسته‌بندی‌ها" }, ...categories];

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
        <div className="site-container">
          <div className="flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] h-16 gap-4">
            {/* Search Bar — right side, wider */}
            <div className="hidden md:flex border border-border rounded-full bg-surface shadow-sm focus-within:ring-1 focus-within:ring-primary transition-shadow max-w-md">
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
                      {categoryOptions.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setIsDropdownOpen(false);
                            router.push(
                              category.id === 0
                                ? "/products"
                                : `/products?category=${category.id}`
                            );
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-content rounded-xl hover:bg-surface-2 hover:text-primary transition-colors"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div ref={searchRef} className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                    placeholder="اسباب‌بازی مورد نظر را جستجو کنید"
                    className="w-full h-10 pl-10 pr-4 py-2 rounded-l-full bg-surface text-content text-sm placeholder:text-content-subtle placeholder:text-sm focus:outline-none text-right"
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

                  {/* Search Results Dropdown */}
                  {searchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border last:border-0"
                        >
                          <img
                            src={productImage(product, 80, 80)}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-2"
                          />
                          <div className="flex-1 text-right min-w-0">
                            <p className="text-sm font-medium text-content truncate">{product.name}</p>
                            <p className="text-xs text-content-muted">{formatPersianNumber(product.price)} تومان</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logo — center */}
            <div className="flex items-center justify-center">
              <Link
                href="/"
                aria-label="متال گالری - صفحه اصلی"
                className="flex items-center gap-2"
              >
                <Image
                  src="/images/logo.png"
                  alt="متال گالری"
                  width={80}
                  height={80}
                  className="w-20 sm:w-24 object-contain dark:brightness-0 dark:invert"
                />
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2.5 sm:gap-3 justify-end">
              <div className="hidden lg:flex items-center gap-2 text-content-muted ml-4 border-l border-border pl-4">
                <span className="text-sm">
                  {settings?.phone ? toPersianNumber(settings.phone) : "۰۲۱-۱۲۳۴۵۶۷۸"}
                </span>
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
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:text-primary hover:border-primary transition-colors relative"
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notifUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
                      {toPersianNumber(notifUnread)}
                    </span>
                  )}
                </button>
                {openDropdown === "notifications" && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-content text-right">
                        اعلان‌ها
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-content-muted">
                          {customer ? "اعلان جدیدی ندارید" : "برای مشاهده اعلان‌ها وارد شوید"}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href="/profile/orders"
                            onClick={() => setOpenDropdown(null)}
                            className="block p-4 border-b border-border hover:bg-surface-2 transition-colors"
                          >
                            <p className="text-sm text-content text-right">{n.text}</p>
                            <p className="text-xs text-content-subtle text-right mt-1">
                              {timeAgo(n.at)}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-border">
                      <Link
                        href={customer ? "/profile/orders" : "/login"}
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full text-sm text-primary hover:text-primary-hover text-center font-medium transition-colors"
                      >
                        {customer ? "مشاهده سفارش‌های من" : "ورود به حساب"}
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
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:text-primary hover:border-primary transition-colors relative"
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
                      {toPersianNumber(wishlistCount)}
                    </span>
                  )}
                </button>
                {openDropdown === "favorites" && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-content text-right">
                        علاقه‌مندی‌ها
                      </h3>
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-sm text-content-muted">
                        {wishlistCount > 0
                          ? `${toPersianNumber(wishlistCount)} محصول در لیست شما ذخیره شده است`
                          : "لیست علاقه‌مندی‌های شما خالی است"}
                      </p>
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
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:text-primary hover:border-primary transition-colors relative"
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-surface">
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
                                src={productImage(item)}
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
                          className="flex-1 inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer rounded-full active:scale-95 bg-primary text-primary-content shadow-sm shadow-primary/30 hover:bg-primary-hover px-4 py-2 text-sm"
                        >
                          تسویه حساب
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div ref={profileDropdownRef} className="relative flex items-center">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "profile" ? null : "profile"
                    )
                  }
                  aria-label="حساب کاربری"
                  className={`h-10 w-10 inline-flex items-center justify-center rounded-full transition-colors ${
                    customer?.avatar
                      ? ""
                      : "border border-border bg-surface-2 text-content hover:text-primary hover:border-primary"
                  }`}
                >
                  {customer?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={customer.avatar} alt="" className="block h-10 w-10 rounded-full object-cover" />
                  ) : (
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </button>
                {openDropdown === "profile" && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-soft rounded-full overflow-hidden flex items-center justify-center">
                          {customer?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customer.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
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
                          )}
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-sm font-semibold text-content">
                            {customer ? (customer.name || "حساب کاربری") : "کاربر مهمان"}
                          </p>
                          <p className="text-xs text-content-subtle" dir="ltr">
                            {customer ? toPersianNumber(customer.phone) : "وارد نشده‌اید"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {customer ? (
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setOpenDropdown(null)}
                          className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                        >
                          پروفایل من
                        </Link>
                        <Link
                          href="/profile/orders"
                          onClick={() => setOpenDropdown(null)}
                          className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                        >
                          سفارش‌های من
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={() => setOpenDropdown(null)}
                          className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                        >
                          لیست علاقه‌مندی‌ها
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setOpenDropdown(null)}
                          className="block px-4 py-2 text-sm text-content hover:bg-surface-2 hover:text-primary text-right transition-colors"
                        >
                          سبد خرید
                        </Link>
                        <div className="border-t border-border my-2"></div>
                        <button
                          onClick={() => void handleLogout()}
                          className="block w-full px-4 py-2 text-sm text-primary hover:bg-primary-soft text-right transition-colors"
                        >
                          خروج از حساب کاربری
                        </button>
                      </div>
                    ) : (
                      <div className="py-2">
                        <Link
                          href="/login"
                          onClick={() => setOpenDropdown(null)}
                          className="block px-4 py-2 text-sm font-bold text-primary hover:bg-primary-soft text-right transition-colors"
                        >
                          ورود / ثبت‌نام
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:text-primary hover:border-primary transition-colors"
                aria-label="باز کردن منو"
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
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
              placeholder="اسباب‌بازی مورد نظر را جستجو کنید"
              className="w-full h-11 pl-10 pr-4 rounded-full border border-border bg-surface-2 text-content text-xs placeholder:text-content-subtle placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right transition-shadow"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle">
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

            {/* Mobile Search Results */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border last:border-0"
                  >
                    <img
                      src={productImage(product, 80, 80)}
                      alt={product.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-2"
                    />
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-sm font-medium text-content truncate">{product.name}</p>
                      <p className="text-xs text-content-muted">{formatPersianNumber(product.price)} تومان</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
          <div className="absolute left-0 top-0 w-80 max-w-[85vw] h-full bg-surface border-r border-border overflow-y-auto overscroll-contain pb-16">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border flex items-center justify-between p-4">
              <span className="font-bold text-content text-lg">منو</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:text-primary hover:border-primary transition-colors"
                aria-label="بستن منو"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="px-4 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-3 border-b border-border text-content hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Categories Accordion */}
            <div className="border-b border-border">
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "categories" ? null : "categories")}
                className="w-full flex items-center justify-between px-4 py-3.5 text-content hover:text-primary transition-colors"
              >
                <span className="font-bold text-sm">دسته‌بندی‌ها</span>
                <svg
                  className={`w-4 h-4 transition-transform ${mobileExpanded === "categories" ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileExpanded === "categories" && (
                <div className="px-4 pb-4 space-y-3">
                  {/* اسباب‌بازی‌ها */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">نوع بازی</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.toys.playType.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* برندها */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">برندها</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.toys.brands.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* رده سنی */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">رده سنی</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.ageAndPrice.age.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* قیمت */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">قیمت</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.ageAndPrice.price.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* شخصیت‌ها */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">شخصیت‌ها و تم</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.themes.characters.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* ویژه */}
                  <div>
                    <h4 className="text-xs font-bold text-content-subtle mb-2">ویژه</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {megaMenuData.themes.special.items.map((item, i) => (
                        <Link key={i} href="/products" onClick={() => setMobileOpen(false)}
                          className="text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Services Accordion */}
            <div className="border-b border-border">
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "services" ? null : "services")}
                className="w-full flex items-center justify-between px-4 py-3.5 text-content hover:text-primary transition-colors"
              >
                <span className="font-bold text-sm">خدمات</span>
                <svg
                  className={`w-4 h-4 transition-transform ${mobileExpanded === "services" ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileExpanded === "services" && (
                <div className="px-4 pb-4 space-y-1">
                  {[
                    { label: "ارسال رایگان", href: "/about" },
                    { label: "تحویل سریع", href: "/about" },
                    { label: "رهگیری سفارش", href: "/about" },
                    { label: "تحویل درب منزل", href: "/about" },
                    { label: "ارسال به سراسر کشور", href: "/about" },
                    { label: "۷ روز بازگشت", href: "/about" },
                    { label: "ضمانت اصالت", href: "/about" },
                    { label: "تعویض کالا", href: "/about" },
                    { label: "بازگشت وجه", href: "/about" },
                    { label: "ضمانت ایمنی و استاندارد", href: "/about" },
                    { label: "بسته‌بندی هدیه", href: "/about" },
                    { label: "کارت هدیه", href: "/about" },
                    { label: "باشگاه مشتریان", href: "/about" },
                    { label: "امتیازات و جوایز", href: "/about" },
                    { label: "پیشنهاد تولد", href: "/about" },
                    { label: "مشاوره خرید", href: "/contact" },
                    { label: "راهنمای سنی", href: "/contact" },
                    { label: "پشتیبانی ۲۴/۷", href: "/contact" },
                    { label: "سوالات متداول", href: "/contact" },
                    { label: "تماس با کارشناسان", href: "/about" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-content-subtle shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="hidden md:block bg-surface border-b border-border relative">
        <div className="site-container">
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
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  خانه
                </Link>
                <Link
                  href="/products"
                  className="text-content-muted hover:text-primary transition-colors"
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
                  className="text-content-muted hover:text-primary transition-colors flex items-center gap-1"
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
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  بلاگ
                </Link>
                <Link
                  href="/about"
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  درباره ما
                </Link>
                <Link
                  href="/contact"
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  تماس با ما
                </Link>
                <Link
                  href="/gallery"
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  گالری
                </Link>
                <Link
                  href="/news"
                  className="text-content-muted hover:text-primary transition-colors"
                >
                  اخبار
                </Link>
              </div>
            </div>

            {/* Categories Mega Menu Dropdown */}
            <div
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-7xl bg-surface shadow-2xl rounded-3xl border border-border text-content z-50 transition-all duration-300 ease-out overflow-hidden ${
                activeMegaMenu === "categories"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("categories")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="relative grid grid-cols-1 md:grid-cols-3 divide-x divide-border p-4 sm:p-6 bg-dots-fade">
                {/* اسباب‌بازی‌ها Column */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                    اسباب‌بازی‌ها
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(megaMenuData.toys).map(([key, section]) => (
                      <div key={key}>
                        <h4 className="text-xs font-bold text-content-subtle mb-2">{section.title}</h4>
                        <div className="space-y-0.5">
                          {section.items.map((item, index) => (
                            <Link
                              key={index}
                              href="/products"
                              className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* رده سنی و قیمت Column */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 100-6 3 3 0 000 6zm7 6a4 4 0 00-8 0m12-3a3 3 0 10-2-5.24" />
                      </svg>
                    </span>
                    رده سنی و قیمت
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(megaMenuData.ageAndPrice).map(([key, section]) => (
                      <div key={key}>
                        <h4 className="text-xs font-bold text-content-subtle mb-2">{section.title}</h4>
                        <div className="space-y-0.5">
                          {section.items.map((item, index) => (
                            <Link
                              key={index}
                              href="/products"
                              className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* شخصیت‌ها و تم Column */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </span>
                    شخصیت‌ها و تم
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(megaMenuData.themes).map(([key, section]) => (
                      <div key={key}>
                        <h4 className="text-xs font-bold text-content-subtle mb-2">{section.title}</h4>
                        <div className="space-y-0.5">
                          {section.items.map((item, index) => (
                            <Link
                              key={index}
                              href="/products"
                              className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Mega Menu */}
            <div
              ref={servicesMenuRef}
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-7xl bg-surface shadow-2xl rounded-3xl border border-border text-content z-50 transition-all duration-300 ease-out overflow-hidden ${
                activeMegaMenu === "services"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
              onMouseEnter={() => setActiveMegaMenu("services")}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-border p-4 sm:p-6 bg-dots-fade">
                {/* تحویل و ارسال */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM20 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H3m10 11h6v-5m0 0l-3-3h-3m6 3H13" />
                      </svg>
                    </span>
                    تحویل و ارسال
                  </h3>
                  <div className="space-y-0.5">
                    {["ارسال رایگان", "تحویل سریع", "رهگیری سفارش", "تحویل درب منزل", "ارسال به سراسر کشور"].map((item) => (
                      <a key={item} href="/about" className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group">
                        <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
                {/* ضمانت و مرجوعی */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    ضمانت و مرجوعی
                  </h3>
                  <div className="space-y-0.5">
                    {["۷ روز بازگشت", "ضمانت اصالت", "تعویض کالا", "بازگشت وجه", "ضمانت ایمنی و استاندارد"].map((item) => (
                      <a key={item} href="/about" className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group">
                        <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
                {/* هدیه و باشگاه */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-7-4v16" />
                      </svg>
                    </span>
                    هدیه و باشگاه
                  </h3>
                  <div className="space-y-0.5">
                    {["بسته‌بندی هدیه", "کارت هدیه", "باشگاه مشتریان", "امتیازات و جوایز", "پیشنهاد تولد"].map((item) => (
                      <a key={item} href="/about" className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group">
                        <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
                {/* پشتیبانی */}
                <div className="px-5">
                  <h3 className="text-sm font-bold text-content mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </span>
                    پشتیبانی
                  </h3>
                  <div className="space-y-0.5">
                    {["مشاوره خرید", "راهنمای سنی", "پشتیبانی ۲۴/۷", "سوالات متداول", "تماس با کارشناسان"].map((item) => (
                      <a key={item} href="/contact" className="flex items-center gap-2 text-sm text-content-muted hover:text-primary hover:bg-surface-2 px-2 py-1.5 rounded-lg transition-colors group">
                        <span className="w-1 h-1 rounded-full bg-content-subtle group-hover:bg-primary transition-colors shrink-0" />
                        {item}
                      </a>
                    ))}
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
