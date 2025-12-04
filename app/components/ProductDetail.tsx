"use client";

import { useState } from "react";
import Button from "./Button";
import { formatPersianNumber, toPersianNumber } from "../utils/numbers";

interface ProductDetailProps {
  productId: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  description: string;
  specifications: {
    [key: string]: string;
  };
  inStock: boolean;
  stockCount: number;
}

interface Comment {
  id: number;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

// Mock product data - In a real app, this would come from an API
const getProductData = (id: string): Product => {
  const products: { [key: string]: Product } = {
    "1": {
      id: 1,
      name: "اسباب‌بازی کامیون",
      price: 12.0,
      originalPrice: 15.0,
      images: ["🚛", "🚚", "🚜", "🚗"],
      rating: 5,
      reviewCount: 24,
      description:
        "این اسباب‌بازی کامیون با طراحی زیبا و رنگ‌های جذاب، مناسب برای کودکان بالای ۳ سال است. این محصول از مواد باکیفیت و غیرسمی ساخته شده و برای بازی‌های خلاقانه و سرگرم‌کننده مناسب است.",
      specifications: {
        "رده سنی": "۳ تا ۸ سال",
        "جنس": "پلاستیک باکیفیت",
        "ابعاد": "۲۰ × ۱۵ × ۱۰ سانتی‌متر",
        "وزن": "۳۰۰ گرم",
        "رنگ": "آبی و قرمز",
        "کشور سازنده": "ایران",
        "گارانتی": "۶ ماه",
      },
      inStock: true,
      stockCount: 15,
    },
    "2": {
      id: 2,
      name: "بلوک‌های ساختمانی",
      price: 10.0,
      originalPrice: 12.0,
      images: ["🧱", "🏗️", "🏛️", "🏠"],
      rating: 5,
      reviewCount: 18,
      description:
        "مجموعه بلوک‌های ساختمانی شامل قطعات مختلف برای ساخت سازه‌های خلاقانه. این محصول به تقویت مهارت‌های حرکتی و خلاقیت کودکان کمک می‌کند.",
      specifications: {
        "رده سنی": "۴ تا ۱۰ سال",
        "جنس": "پلاستیک ABS",
        "تعداد قطعات": "۵۰ قطعه",
        "ابعاد بسته‌بندی": "۳۰ × ۲۰ × ۱۵ سانتی‌متر",
        "وزن": "۵۰۰ گرم",
        "رنگ": "چند رنگ",
        "کشور سازنده": "ایران",
        "گارانتی": "۱۲ ماه",
      },
      inStock: true,
      stockCount: 8,
    },
  };

  return (
    products[id] || {
      id: parseInt(id),
      name: "محصول نمونه",
      price: 20.0,
      images: ["🧸", "🎁", "🎯", "🎨"],
      rating: 4,
      reviewCount: 12,
      description: "توضیحات محصول",
      specifications: {
        "رده سنی": "۳ تا ۶ سال",
        "جنس": "پلاستیک",
        "ابعاد": "۱۵ × ۱۵ × ۱۵ سانتی‌متر",
      },
      inStock: true,
      stockCount: 10,
    }
  );
};

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

export default function ProductDetail({ productId }: ProductDetailProps) {
  const product = getProductData(productId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "comments">("specs");

  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const handleAddToCart = () => {
    // Add to cart logic here
    alert(`${quantity} عدد ${product.name} به سبد خرید اضافه شد`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <span>خانه</span>
          <span className="mx-2">/</span>
          <span>اسباب‌بازی</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div>
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-12 flex items-center justify-center h-96 mb-4">
                  <div className="text-9xl">{product.images[selectedImage]}</div>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-20 h-20 rounded-lg p-4 flex items-center justify-center text-3xl border-2 transition-colors ${
                        selectedImage === index
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {image}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${
                        i < product.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">
                  ({toPersianNumber(product.reviewCount.toString())} نظر)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPersianNumber(product.price)} تومان
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPersianNumber(product.originalPrice)} تومان
                      </span>
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {toPersianNumber(discountPercentage.toString())}% تخفیف
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>
                      موجود در انبار ({toPersianNumber(product.stockCount.toString())} عدد)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>ناموجود</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">تعداد:</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {toPersianNumber(quantity.toString())}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stockCount, quantity + 1)
                      )
                    }
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  افزودن به سبد خرید
                </Button>
                <Button variant="outline" size="lg">
                  ❤️
                </Button>
              </div>

              {/* Description Preview */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">توضیحات کوتاه:</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab("specs")}
                className={`py-4 px-6 font-semibold border-b-2 transition-colors ${
                  activeTab === "specs"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                مشخصات فنی
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`py-4 px-6 font-semibold border-b-2 transition-colors ${
                  activeTab === "comments"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                نظرات ({toPersianNumber(product.reviewCount.toString())})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "specs" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  مشخصات فنی محصول
                </h3>
                <div className="space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex border-b border-gray-100 pb-4 last:border-0"
                    >
                      <div className="w-1/3 font-semibold text-gray-700">{key}:</div>
                      <div className="w-2/3 text-gray-600">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  نظرات خریداران
                </h3>

                {/* Add Comment Form */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    نظر خود را ثبت کنید
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">امتیاز:</label>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">نظر شما:</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className="border-b border-gray-100 pb-6 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold">
                            {comment.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {comment.userName}
                              </span>
                              {comment.verified && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
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
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {comment.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            محصولات مرتبط
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 2, name: "بلوک‌های ساختمانی", price: 10.0, image: "🧱" },
              { id: 3, name: "دایناسور پلوش", price: 18.0, image: "🦕" },
              { id: 4, name: "خرسی پلوش", price: 15.0, image: "🧸" },
              { id: 5, name: "پاندای پلوش", price: 16.0, image: "🐼" },
            ]
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <a
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-gray-100 rounded-lg p-6 mb-3 flex items-center justify-center h-32">
                    <div className="text-5xl">{relatedProduct.image}</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {relatedProduct.name}
                  </h3>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPersianNumber(relatedProduct.price)} تومان
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}


