"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useCart } from "@/app/components/CartContext";
import { productImage } from "@/app/utils/images";
import { formatPersianNumber, toPersianNumber } from "@/app/utils/numbers";
import { discountPercent, type Category, type Product } from "@/lib/types";
import QuickLookModal from "@/app/components/QuickLookModal";

type SortOption = "newest" | "price-low" | "price-high" | "rating" | "name";

const priceRanges = [
  { label: "همه قیمت‌ها", min: 0, max: Infinity },
  { label: "زیر ۵۰۰ هزار تومان", min: 0, max: 500000 },
  { label: "۵۰۰ هزار تا ۱ میلیون تومان", min: 500000, max: 1000000 },
  { label: "۱ تا ۲ میلیون تومان", min: 1000000, max: 2000000 },
  { label: "بالای ۲ میلیون تومان", min: 2000000, max: Infinity },
];

const ratingFilters = [5, 4, 3, 2, 1];

const SORT_OPTIONS: SortOption[] = [
  "newest",
  "price-low",
  "price-high",
  "rating",
  "name",
];

/** Map a URL `sort` value onto a SortOption, tolerating a few menu aliases. */
function coerceSort(raw: string | null): SortOption | null {
  if (!raw) return null;
  if ((SORT_OPTIONS as string[]).includes(raw)) return raw as SortOption;
  if (raw === "best-selling" || raw === "bestselling" || raw === "popular")
    return "rating"; // پرفروش‌ترین‌ها -> highest rated (no sales metric today)
  return null;
}

/** A URL flag is "on" unless it is absent / "0" / "false". */
function isTruthyParam(raw: string | null): boolean {
  return raw !== null && raw !== "0" && raw !== "false";
}

/** Latin-ise Persian/Arabic-Indic digits, then read the numeric [min,max] out of
 *  an age label like "3-8 سال", "۹-۱۲ سال", "12+ سال", "0-2" or "12-". A trailing
 *  "+"/"-" (and "12+ سال") means "and up" -> max = Infinity. */
function parseAgeBounds(
  raw: string | null | undefined
): { min: number; max: number } | null {
  if (!raw) return null;
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const nums = latin.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const openEnded = /\+/.test(latin) || /-\s*$/.test(latin.trim());
  const min = parseInt(nums[0], 10);
  const max = openEnded ? Infinity : parseInt(nums[1] ?? nums[0], 10);
  return { min, max };
}

/** Normalise Persian text for substring search: unify Arabic/Persian Yeh & Kaf,
 *  drop the ZWNJ (نیم‌فاصله), collapse whitespace, lower-case any Latin. */
function normalizeFa(s: string): string {
  return s
    .replace(/‌/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

interface ProductListingProps {
  products: Product[];
  categories: Category[];
}

export default function ProductListing({
  products,
  categories,
}: ProductListingProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const qFromUrl = searchParams.get("q");
  const ageFromUrl = searchParams.get("age");
  const sortFromUrl = searchParams.get("sort");
  const dealFromUrl = searchParams.get("deal");
  const trendingFromUrl = searchParams.get("trending");
  const priceFromUrl = searchParams.get("price");
  const { add } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryFromUrl ? parseInt(categoryFromUrl) : null
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(
    priceFromUrl ? Math.min(Math.max(parseInt(priceFromUrl) || 0, 0), priceRanges.length - 1) : 0
  );
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  // URL / mega-menu driven age filter (numeric range overlap) — kept SEPARATE
  // from the sidebar's exact-match selectedAgeGroup; the two are reconciled to be
  // mutually exclusive (see the age sync + the sidebar onChange edits).
  const [ageRange, setAgeRange] = useState<{ min: number; max: number } | null>(
    parseAgeBounds(ageFromUrl)
  );
  const [searchQuery, setSearchQuery] = useState(qFromUrl ?? "");
  const [dealOnly, setDealOnly] = useState<boolean>(isTruthyParam(dealFromUrl));
  const [trendingOnly, setTrendingOnly] = useState<boolean>(
    isTruthyParam(trendingFromUrl)
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    coerceSort(sortFromUrl) ?? "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});
  const [quickLookProduct, setQuickLookProduct] = useState<Product | null>(null);
  const productsPerPage = 9;

  // Sync the selected category when the URL's category param changes (client-side
  // navigation keeps this component mounted). Adjusting state during render is
  // React's recommended alternative to a setState-in-effect.
  // https://react.dev/learn/you-might-not-need-an-effect
  // Every mega-menu link is a fresh filter: each param reflects the URL exactly
  // and clears when it leaves the URL, and any change snaps pagination to page 1.
  // Adjusting state during render (guarded by a prev!==current check that also
  // updates prev, so it never loops) is React's alternative to setState-in-effect.
  const [prevCategoryFromUrl, setPrevCategoryFromUrl] = useState(categoryFromUrl);
  if (categoryFromUrl !== prevCategoryFromUrl) {
    setPrevCategoryFromUrl(categoryFromUrl);
    setSelectedCategory(categoryFromUrl ? parseInt(categoryFromUrl) : null);
    setCurrentPage(1);
  }

  const [prevQFromUrl, setPrevQFromUrl] = useState(qFromUrl);
  if (qFromUrl !== prevQFromUrl) {
    setPrevQFromUrl(qFromUrl);
    setSearchQuery(qFromUrl ?? "");
    setCurrentPage(1);
  }

  const [prevAgeFromUrl, setPrevAgeFromUrl] = useState(ageFromUrl);
  if (ageFromUrl !== prevAgeFromUrl) {
    setPrevAgeFromUrl(ageFromUrl);
    setAgeRange(parseAgeBounds(ageFromUrl));
    setSelectedAgeGroup(null); // URL range supersedes the sidebar exact-match
    setCurrentPage(1);
  }

  const [prevSortFromUrl, setPrevSortFromUrl] = useState(sortFromUrl);
  if (sortFromUrl !== prevSortFromUrl) {
    setPrevSortFromUrl(sortFromUrl);
    const coerced = coerceSort(sortFromUrl);
    if (coerced) setSortBy(coerced);
    setCurrentPage(1);
  }

  const [prevDealFromUrl, setPrevDealFromUrl] = useState(dealFromUrl);
  if (dealFromUrl !== prevDealFromUrl) {
    setPrevDealFromUrl(dealFromUrl);
    setDealOnly(isTruthyParam(dealFromUrl));
    setCurrentPage(1);
  }

  const [prevTrendingFromUrl, setPrevTrendingFromUrl] = useState(trendingFromUrl);
  if (trendingFromUrl !== prevTrendingFromUrl) {
    setPrevTrendingFromUrl(trendingFromUrl);
    setTrendingOnly(isTruthyParam(trendingFromUrl));
    setCurrentPage(1);
  }

  const [prevPriceFromUrl, setPrevPriceFromUrl] = useState(priceFromUrl);
  if (priceFromUrl !== prevPriceFromUrl) {
    setPrevPriceFromUrl(priceFromUrl);
    const idx = priceFromUrl ? parseInt(priceFromUrl) : 0;
    setSelectedPriceRange(
      Number.isFinite(idx) ? Math.min(Math.max(idx, 0), priceRanges.length - 1) : 0
    );
    setCurrentPage(1);
  }

  // Distinct age groups actually present in the catalogue.
  const ageGroups = useMemo(() => {
    const distinct = Array.from(
      new Set(products.map((p) => p.ageGroup).filter(Boolean))
    );
    distinct.sort(
      (a, b) => (parseInt(a) || 0) - (parseInt(b) || 0) || a.localeCompare(b, "fa")
    );
    return distinct;
  }, [products]);

  // Normalised category names by id — lets the `q` search also match on the
  // product's category name.
  const categoryNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) m.set(c.id, normalizeFa(c.name));
    return m;
  }, [categories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Free-text search (q) over name + description + category name.
    const q = normalizeFa(searchQuery);
    if (q) {
      filtered = filtered.filter(
        (p) =>
          normalizeFa(p.name).includes(q) ||
          normalizeFa(p.description).includes(q) ||
          (categoryNameById.get(p.categoryId) ?? "").includes(q)
      );
    }

    // Deals only (تخفیف‌دار).
    if (dealOnly) {
      filtered = filtered.filter((p) => p.isDeal);
    }

    // Trending / featured only (پیشنهاد ویژه).
    if (trendingOnly) {
      filtered = filtered.filter((p) => p.isTrending);
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

    // Filter by age group (sidebar exact-match)
    if (selectedAgeGroup) {
      filtered = filtered.filter((p) => p.ageGroup === selectedAgeGroup);
    }

    // Filter by age range (URL / mega-menu). A product matches when its declared
    // range overlaps the requested one, so `age=3-5` still catches a product
    // tagged "2-6 سال" or "0-3 سال".
    if (ageRange) {
      filtered = filtered.filter((p) => {
        const b = parseAgeBounds(p.ageGroup);
        return b !== null && b.min <= ageRange.max && b.max >= ageRange.min;
      });
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
    products,
    selectedCategory,
    selectedPriceRange,
    selectedRating,
    selectedAgeGroup,
    ageRange,
    searchQuery,
    dealOnly,
    trendingOnly,
    categoryNameById,
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
    setAgeRange(null);
    setDealOnly(false);
    setTrendingOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0 || addedIds[product.id]) return;
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      imageKeyword: product.imageKeyword,
      imageLock: product.imageLock,
    });
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }, 1500);
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedPriceRange > 0 ||
    selectedRating ||
    selectedAgeGroup ||
    ageRange ||
    dealOnly ||
    trendingOnly ||
    searchQuery.trim().length > 0;

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-content mb-2">
            همه محصولات
          </h1>
          <p className="text-sm sm:text-base text-content-muted">
            {toPersianNumber(filteredProducts.length.toString())} محصول یافت شد
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar — mobile overlay when open, static column on lg */}
          <aside
            className={`shrink-0 lg:block lg:w-64 ${
              showFilters ? "fixed inset-0 z-50 lg:static lg:z-auto" : "hidden"
            }`}
          >
            {/* Backdrop (mobile overlay only) */}
            {showFilters && (
              <div
                className="absolute inset-0 bg-black/40 lg:hidden"
                onClick={() => setShowFilters(false)}
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-y-0 right-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-surface p-5 shadow-xl lg:sticky lg:top-4 lg:bottom-auto lg:right-auto lg:h-auto lg:w-auto lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:p-6 lg:shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-content">فیلترها</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="بستن فیلترها"
                  className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-content-muted hover:text-content hover:bg-surface-2 active:bg-surface-3 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full mb-6 text-sm text-primary hover:text-primary-hover font-semibold"
                >
                  پاک کردن فیلترها
                </button>
              )}

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-content mb-3">دسته‌بندی</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === null}
                      onChange={() => setSelectedCategory(null)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-content-muted">همه</span>
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
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-content-muted">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-content mb-3">محدوده قیمت</h3>
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
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-content-muted">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-content mb-3">امتیاز</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedRating === null}
                      onChange={() => setSelectedRating(null)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-content-muted">همه</span>
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
                        className="w-4 h-4 accent-primary"
                      />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < rating ? "text-star" : "text-content-subtle"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-content-muted text-sm mr-1">به بالا</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              {ageGroups.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-content mb-3">رده سنی</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="age"
                        checked={selectedAgeGroup === null}
                        onChange={() => {
                          setSelectedAgeGroup(null);
                          setAgeRange(null);
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-content-muted">همه</span>
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
                            setAgeRange(null);
                            setCurrentPage(1);
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-content-muted">
                          {toPersianNumber(age)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-content hover:bg-surface-2 active:bg-surface-3 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span>فیلترها</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 sm:justify-end">
                <label className="text-sm text-content-muted shrink-0">مرتب‌سازی:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  className="flex-1 sm:flex-none h-10 bg-surface border border-border rounded-xl px-3 sm:px-4 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
                  {paginatedProducts.map((product) => {
                    const off = discountPercent(product);
                    const outOfStock = product.stock <= 0;
                    const added = !!addedIds[product.id];
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="group bg-surface border border-border rounded-2xl shadow-sm p-3 sm:p-4 transition-colors block"
                      >
                        <div className="relative h-36 sm:h-48 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-surface-2 mb-3 sm:mb-4">
                          <img
                            src={productImage(product)}
                            alt={product.name}
                            loading="lazy"
                            className={`h-full w-full object-cover ${
                              outOfStock ? "opacity-60 grayscale" : ""
                            }`}
                          />
                          {/* Quick Look button */}
                          {!outOfStock && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuickLookProduct(product);
                              }}
                              aria-label={`مشاهده سریع ${product.name}`}
                              className="absolute bottom-2 left-2 h-9 w-9 inline-flex items-center justify-center rounded-full border border-border bg-surface/90 text-content hover:text-primary hover:border-primary hover:bg-surface backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {off > 0 && !outOfStock && (
                            <span className="absolute top-2 right-2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-content shadow-sm">
                              ٪{toPersianNumber(off.toString())} تخفیف
                            </span>
                          )}
                          {outOfStock && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="rounded-full bg-surface border border-border px-3 py-1.5 text-xs font-bold text-content shadow-sm">
                                ناموجود
                              </span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-content mb-2 text-xs sm:text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs sm:text-sm ${
                                i < Math.round(product.rating)
                                  ? "text-star"
                                  : "text-content-subtle"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-xs text-content-subtle mr-2">
                            ({toPersianNumber(product.reviewCount.toString())})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 sm:mb-4">
                          <span className="text-sm sm:text-lg font-bold text-content">
                            {formatPersianNumber(product.price)} تومان
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs sm:text-sm text-content-subtle line-through">
                              {formatPersianNumber(product.originalPrice)} تومان
                            </span>
                          )}
                        </div>
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <Button
                            variant={added ? "accent" : "primary"}
                            size="sm"
                            className="w-full"
                            disabled={outOfStock}
                          >
                            {outOfStock
                              ? "ناموجود"
                              : added
                                ? "افزوده شد"
                                : "افزودن به سبد خرید"}
                          </Button>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-10 px-3 sm:px-4 text-sm border border-border rounded-xl text-content disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-2 active:bg-surface-3 transition-colors"
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
                            className={`min-w-10 h-10 px-2 text-sm border rounded-xl transition-colors ${
                              currentPage === page
                                ? "bg-primary text-primary-content border-primary"
                                : "border-border text-content hover:bg-surface-2 active:bg-surface-3"
                            }`}
                          >
                            {toPersianNumber(page.toString())}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="text-content-muted">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="h-10 px-3 sm:px-4 text-sm border border-border rounded-xl text-content disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-2 active:bg-surface-3 transition-colors"
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 sm:p-12 text-center">
                <div className="mb-4 flex justify-center"><svg className="w-16 h-16 text-content-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                <h3 className="text-lg sm:text-xl font-semibold text-content mb-2">
                  محصولی یافت نشد
                </h3>
                <p className="text-content-muted mb-6">
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

    {/* Quick Look Modal */}
    {quickLookProduct && (
      <QuickLookModal
        product={quickLookProduct}
        open={!!quickLookProduct}
        onClose={() => setQuickLookProduct(null)}
      />
    )}
    </>
  );
}
