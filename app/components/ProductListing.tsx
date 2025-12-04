"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "./Button";
import { formatPersianNumber, toPersianNumber } from "../utils/numbers";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  categoryId: number;
  ageGroup?: string;
  inStock: boolean;
}

type SortOption = "newest" | "price-low" | "price-high" | "rating" | "name";

// Mock products data - In a real app, this would come from an API
const allProducts: Product[] = [
  {
    id: 1,
    name: "اسباب‌بازی کامیون",
    price: 12.0,
    originalPrice: 15.0,
    image: "🚛",
    rating: 5,
    reviewCount: 24,
    category: "اسباب‌بازی و بازی",
    categoryId: 1,
    ageGroup: "3-8 سال",
    inStock: true,
  },
  {
    id: 2,
    name: "بلوک‌های ساختمانی",
    price: 10.0,
    originalPrice: 12.0,
    image: "🧱",
    rating: 5,
    reviewCount: 18,
    category: "اسباب‌بازی هوشمند",
    categoryId: 2,
    ageGroup: "4-10 سال",
    inStock: true,
  },
  {
    id: 3,
    name: "دایناسور پلوش آبی",
    price: 18.0,
    originalPrice: 22.0,
    image: "🦕",
    rating: 5,
    reviewCount: 15,
    category: "اسباب‌بازی و بازی",
    categoryId: 1,
    ageGroup: "2-6 سال",
    inStock: true,
  },
  {
    id: 4,
    name: "خرسی پلوش",
    price: 15.0,
    originalPrice: 20.0,
    image: "🧸",
    rating: 4,
    reviewCount: 32,
    category: "اسباب‌بازی و بازی",
    categoryId: 1,
    ageGroup: "0-3 سال",
    inStock: true,
  },
  {
    id: 5,
    name: "پاندای پلوش",
    price: 16.0,
    originalPrice: 19.0,
    image: "🐼",
    rating: 5,
    reviewCount: 21,
    category: "اسباب‌بازی و بازی",
    categoryId: 1,
    ageGroup: "2-5 سال",
    inStock: true,
  },
  {
    id: 6,
    name: "اسب تک‌نوازی آبی",
    price: 25.0,
    image: "🐴",
    rating: 4,
    reviewCount: 12,
    category: "اسباب‌بازی حرکتی",
    categoryId: 4,
    ageGroup: "3-7 سال",
    inStock: true,
  },
  {
    id: 7,
    name: "اسباب‌بازی استخر صورتی",
    price: 18.0,
    image: "🏊",
    rating: 5,
    reviewCount: 8,
    category: "اسباب‌بازی فضای باز",
    categoryId: 3,
    ageGroup: "4-8 سال",
    inStock: true,
  },
  {
    id: 8,
    name: "اسباب‌بازی موسیقی",
    price: 20.0,
    image: "🎵",
    rating: 4,
    reviewCount: 19,
    category: "اسباب‌بازی هوشمند",
    categoryId: 2,
    ageGroup: "1-5 سال",
    inStock: true,
  },
  {
    id: 9,
    name: "کامیون اسباب‌بازی سبز",
    price: 28.0,
    image: "🚛",
    rating: 5,
    reviewCount: 16,
    category: "اسباب‌بازی کنترلی",
    categoryId: 5,
    ageGroup: "5-10 سال",
    inStock: true,
  },
  {
    id: 10,
    name: "اسباب‌بازی حلقه چوبی",
    price: 15.0,
    image: "🎯",
    rating: 4,
    reviewCount: 11,
    category: "اسباب‌بازی فضای باز",
    categoryId: 3,
    ageGroup: "3-8 سال",
    inStock: true,
  },
  {
    id: 11,
    name: "کامیون جرثقیل آبی",
    price: 30.0,
    image: "🚛",
    rating: 5,
    reviewCount: 14,
    category: "اسباب‌بازی کنترلی",
    categoryId: 5,
    ageGroup: "6-12 سال",
    inStock: true,
  },
  {
    id: 12,
    name: "بلور گرد",
    price: 12.0,
    image: "🔔",
    rating: 3,
    reviewCount: 7,
    category: "اسباب‌بازی و بازی",
    categoryId: 1,
    ageGroup: "1-4 سال",
    inStock: true,
  },
];

const categories = [
  { id: 1, name: "اسباب‌بازی و بازی", image: "🧸" },
  { id: 2, name: "اسباب‌بازی هوشمند", image: "🧱" },
  { id: 3, name: "اسباب‌بازی فضای باز", image: "🧩" },
  { id: 4, name: "اسباب‌بازی حرکتی", image: "🐴" },
  { id: 5, name: "اسباب‌بازی کنترلی", image: "🦕" },
];

const ageGroups = [
  "0-2 سال",
  "3-5 سال",
  "6-8 سال",
  "9-12 سال",
  "12+ سال",
];

const priceRanges = [
  { label: "همه قیمت‌ها", min: 0, max: Infinity },
  { label: "زیر ۱۵ تومان", min: 0, max: 15 },
  { label: "۱۵ تا ۲۰ تومان", min: 15, max: 20 },
  { label: "۲۰ تا ۲۵ تومان", min: 20, max: 25 },
  { label: "بالای ۲۵ تومان", min: 25, max: Infinity },
];

const ratingFilters = [5, 4, 3, 2, 1];

export default function ProductListing() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryFromUrl ? parseInt(categoryFromUrl) : null
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const productsPerPage = 9;

  // Update category when URL changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    }
  }, [searchParams]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by price range
    if (selectedPriceRange > 0) {
      const range = priceRanges[selectedPriceRange];
      filtered = filtered.filter(
        (p) => p.price >= range.min && p.price <= range.max
      );
    }

    // Filter by rating
    if (selectedRating) {
      filtered = filtered.filter((p) => p.rating >= selectedRating);
    }

    // Filter by age group
    if (selectedAgeGroup) {
      filtered = filtered.filter((p) => p.ageGroup === selectedAgeGroup);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name, "fa");
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return filtered;
  }, [
    selectedCategory,
    selectedPriceRange,
    selectedRating,
    selectedAgeGroup,
    sortBy,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedPriceRange(0);
    setSelectedRating(null);
    setSelectedAgeGroup(null);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedPriceRange > 0 ||
    selectedRating ||
    selectedAgeGroup;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            همه محصولات
          </h1>
          <p className="text-gray-600">
            {toPersianNumber(filteredProducts.length.toString())} محصول یافت شد
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-64 shrink-0 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">فیلترها</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full mb-6 text-sm text-teal-600 hover:text-teal-700 font-semibold"
                >
                  پاک کردن فیلترها
                </button>
              )}

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">دسته‌بندی</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === null}
                      onChange={() => setSelectedCategory(null)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">همه</span>
                  </label>
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.id}
                        onChange={() => {
                          setSelectedCategory(category.id);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">محدوده قیمت</h3>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange === index}
                        onChange={() => {
                          setSelectedPriceRange(index);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">امتیاز</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedRating === null}
                      onChange={() => setSelectedRating(null)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">همه</span>
                  </label>
                  {ratingFilters.map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() => {
                          setSelectedRating(rating);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-teal-600"
                      />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-gray-600 text-sm mr-1">به بالا</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">رده سنی</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="age"
                      checked={selectedAgeGroup === null}
                      onChange={() => setSelectedAgeGroup(null)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">همه</span>
                  </label>
                  {ageGroups.map((age) => (
                    <label
                      key={age}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="age"
                        checked={selectedAgeGroup === age}
                        onChange={() => {
                          setSelectedAgeGroup(age);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-gray-700">{age}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <span>☰</span>
                <span>فیلترها</span>
              </button>

              <div className="flex items-center gap-4 flex-1 justify-end">
                <label className="text-gray-700">مرتب‌سازی:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="price-low">قیمت: کم به زیاد</option>
                  <option value="price-high">قیمت: زیاد به کم</option>
                  <option value="rating">بیشترین امتیاز</option>
                  <option value="name">نام: الف تا ی</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow block"
                    >
                      <div className="bg-gray-100 rounded-lg p-8 mb-4 flex items-center justify-center h-48">
                        <div className="text-6xl">{product.image}</div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < product.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 mr-2">
                          ({toPersianNumber(product.reviewCount.toString())})
                        </span>
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
                        <Button variant="primary" size="sm" className="w-full">
                          افزودن به سبد خرید
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      قبلی
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 border rounded-lg ${
                              currentPage === page
                                ? "bg-teal-600 text-white border-teal-600"
                                : "border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {toPersianNumber(page.toString())}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page}>...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  محصولی یافت نشد
                </h3>
                <p className="text-gray-600 mb-6">
                  لطفاً فیلترهای خود را تغییر دهید
                </p>
                <Button variant="outline" onClick={handleResetFilters}>
                  پاک کردن فیلترها
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

