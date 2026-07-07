"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { toyImage } from "@/app/utils/images";
import { formatPersianNumber, toPersianNumber } from "@/app/utils/numbers";
import { useCart } from "@/app/components/CartContext";
import { discountPercent, type Product } from "@/lib/types";

interface ProductDetailProps {
  product: Product;
  related: Product[];
}

interface Comment {
  id: number;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

// Static display comments (no reviews backend yet).
const mockComments: Comment[] = [
  {
    id: 1,
    userName: "علی احمدی",
    rating: 5,
    date: "۱۴۰۳/۰۸/۱۵",
    comment: "محصول بسیار باکیفیتی بود. فرزندم خیلی از آن راضی است. توصیه می‌کنم.",
    verified: true,
  },
  {
    id: 2,
    userName: "مریم رضایی",
    rating: 5,
    date: "۱۴۰۳/۰۸/۱۰",
    comment: "رنگ‌بندی زیبا و مواد اولیه خوبی دارد. ارزش خرید دارد.",
    verified: true,
  },
  {
    id: 3,
    userName: "حسین کریمی",
    rating: 4,
    date: "۱۴۰۳/۰۸/۰۵",
    comment: "خوب بود ولی انتظار بیشتری داشتم. به طور کلی راضی هستم.",
    verified: false,
  },
];

export default function ProductDetail({ product, related }: ProductDetailProps) {
  const { add } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "comments">("specs");
  const [addedMessage, setAddedMessage] = useState(false);

  const inStock = product.stock > 0;
  const discount = discountPercent(product);

  // Four gallery angles derived from the product's pinned image lock.
  const galleryImages = [0, 1, 2, 3].map((i) =>
    toyImage(product.imageKeyword, product.imageLock * 100 + i)
  );

  const clampQuantity = (q: number) =>
    Math.min(Math.max(1, q), Math.max(1, product.stock));

  const handleAddToCart = () => {
    if (!inStock) return;
    add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageKeyword: product.imageKeyword,
        imageLock: product.imageLock,
        stock: product.stock,
      },
      quantity
    );
    setAddedMessage(true);
    window.setTimeout(() => setAddedMessage(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-xs sm:text-sm text-content-muted">
        <Link href="/" className="shrink-0 transition-colors hover:text-primary">
          خانه
        </Link>
        <span className="mx-2 shrink-0 text-content-subtle">/</span>
        <Link
          href="/products"
          className="shrink-0 transition-colors hover:text-primary"
        >
          اسباب‌بازی
        </Link>
        <span className="mx-2 shrink-0 text-content-subtle">/</span>
        <span className="truncate font-semibold text-content">
          {product.name}
        </span>
      </nav>

      {/* Product Main Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 sm:p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Image Gallery */}
          <div>
            <div className="mb-4">
              <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-2xl bg-surface-2 mb-4">
                <img
                  src={galleryImages[selectedImage]}
                  alt={`${product.name} - تصویر ${toPersianNumber(
                    (selectedImage + 1).toString()
                  )}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {discount > 0 && (
                  <span className="absolute top-4 left-4 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-content shadow-md">
                    {toPersianNumber(discount.toString())}٪ تخفیف
                  </span>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border-2 bg-surface-2 transition-all hover:-translate-y-0.5 active:scale-95 ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary"
                        : "border-border hover:border-border-strong"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - نمای ${toPersianNumber(
                        (index + 1).toString()
                      )}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${
                      i < Math.round(product.rating)
                        ? "text-star"
                        : "text-content-subtle"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm sm:text-base text-content-muted">
                ({toPersianNumber(product.reviewCount.toString())} نظر)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-content">
                  {formatPersianNumber(product.price)} تومان
                </span>
                {discount > 0 && product.originalPrice && (
                  <>
                    <span className="text-lg sm:text-xl text-content-subtle line-through">
                      {formatPersianNumber(product.originalPrice)} تومان
                    </span>
                    <span className="bg-primary-soft text-primary px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {toPersianNumber(discount.toString())}٪ تخفیف
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1.5 text-mint">
                  <span className="w-2.5 h-2.5 bg-mint rounded-full"></span>
                  <span className="text-sm font-semibold">
                    موجود در انبار ({toPersianNumber(product.stock.toString())} عدد)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-primary">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                  <span className="text-sm font-semibold">ناموجود</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base text-content-muted mb-2">
                تعداد:
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                  disabled={!inStock || quantity <= 1}
                  className="w-10 h-10 border border-border rounded-xl flex items-center justify-center text-content text-lg transition-colors hover:bg-surface-2 hover:border-border-strong active:bg-surface-3 disabled:opacity-40 disabled:pointer-events-none"
                >
                  −
                </button>
                <span className="text-xl font-semibold w-12 text-center text-content">
                  {toPersianNumber(quantity.toString())}
                </span>
                <button
                  onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                  disabled={!inStock || quantity >= product.stock}
                  className="w-10 h-10 border border-border rounded-xl flex items-center justify-center text-content text-lg transition-colors hover:bg-surface-2 hover:border-border-strong active:bg-surface-3 disabled:opacity-40 disabled:pointer-events-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:flex-1"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {inStock ? "افزودن به سبد خرید" : "ناموجود"}
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                ❤️
              </Button>
            </div>

            {/* Added-to-cart feedback */}
            <div aria-live="polite" className="mb-6 min-h-6">
              {addedMessage && (
                <div className="inline-flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1.5 text-mint text-sm font-semibold">
                  <span>✓</span>
                  <span>به سبد اضافه شد</span>
                </div>
              )}
            </div>

            {/* Description Preview */}
            <div className="border-t border-border pt-6">
              <h3 className="font-bold text-content mb-2">توضیحات کوتاه:</h3>
              <p className="text-sm sm:text-base text-content-muted leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm mb-8">
        {/* Tab Headers */}
        <div className="border-b border-border">
          <div className="flex gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("specs")}
              className={`shrink-0 whitespace-nowrap py-4 px-3 sm:px-6 text-sm sm:text-base font-semibold border-b-2 transition-colors active:text-primary ${
                activeTab === "specs"
                  ? "border-primary text-primary"
                  : "border-transparent text-content-muted hover:text-content"
              }`}
            >
              مشخصات فنی
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`shrink-0 whitespace-nowrap py-4 px-3 sm:px-6 text-sm sm:text-base font-semibold border-b-2 transition-colors active:text-primary ${
                activeTab === "comments"
                  ? "border-primary text-primary"
                  : "border-transparent text-content-muted hover:text-content"
              }`}
            >
              نظرات ({toPersianNumber(product.reviewCount.toString())})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "specs" && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-content mb-6">
                مشخصات فنی محصول
              </h3>
              {Object.keys(product.specifications).length === 0 ? (
                <p className="text-sm sm:text-base text-content-muted">
                  مشخصاتی برای این محصول ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row gap-1 border-b border-border pb-4 last:border-0"
                    >
                      <div className="sm:w-1/3 text-sm sm:text-base font-semibold text-content">
                        {key}:
                      </div>
                      <div className="sm:w-2/3 text-sm sm:text-base text-content-muted">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-content mb-6">
                نظرات خریداران
              </h3>

              {/* Add Comment Form */}
              <div className="bg-surface-2 border border-border rounded-2xl p-4 sm:p-6 mb-8">
                <h4 className="font-bold text-content mb-4">
                  نظر خود را ثبت کنید
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm sm:text-base text-content-muted mb-2">
                      امتیاز:
                    </label>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          className="text-2xl text-content-subtle hover:text-star active:text-star transition-colors"
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base text-content-muted mb-2">
                      نظر شما:
                    </label>
                    <textarea
                      className="w-full bg-surface border border-border text-content rounded-xl p-3 text-sm sm:text-base placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      placeholder="نظر خود را بنویسید..."
                    />
                  </div>
                  <Button variant="primary">ثبت نظر</Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {mockComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-border pb-6 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 bg-primary-soft rounded-full flex items-center justify-center text-primary font-bold">
                          {comment.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-content">
                              {comment.userName}
                            </span>
                            {comment.verified && (
                              <span className="text-xs bg-mint-soft text-mint px-2 py-1 rounded-full font-semibold">
                                ✓ تأیید شده
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < comment.rating
                                      ? "text-star"
                                      : "text-content-subtle"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-content-subtle">
                              {comment.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-content-muted leading-relaxed">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-content mb-6">
            محصولات مرتبط
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {related.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/product/${relatedProduct.id}`}
                className="group border border-border bg-surface rounded-2xl p-3 sm:p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:shadow-md"
              >
                <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-surface-2 mb-3">
                  <img
                    src={toyImage(
                      relatedProduct.imageKeyword,
                      relatedProduct.imageLock
                    )}
                    alt={relatedProduct.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-semibold text-content mb-2 text-sm line-clamp-2">
                  {relatedProduct.name}
                </h3>
                <div className="text-base sm:text-lg font-bold text-primary">
                  {formatPersianNumber(relatedProduct.price)} تومان
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
