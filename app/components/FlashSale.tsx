import Button from "./Button";
import { toPersianNumber, formatPersianNumber } from "../utils/numbers";

const products = [
  { id: 1, name: "اسب تک‌نوازی آبی", price: 25.00, image: "🐴", rating: 5 },
  { id: 2, name: "اسباب‌بازی استخر صورتی", price: 18.00, image: "🏊", rating: 5 },
  { id: 3, name: "بلوک‌های ساختمانی", price: 22.00, image: "🧱", rating: 5 },
  { id: 4, name: "اسباب‌بازی موسیقی", price: 20.00, image: "🎵", rating: 5 },
  { id: 5, name: "بلور گرد", price: 12.00, image: "🔔", rating: 5 },
];

export default function FlashSale() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">فروش ویژه!</h2>
        
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
                  <span className="text-lg font-bold text-gray-900">{formatPersianNumber(product.price)} تومان</span>
                </div>
                <Button variant="primary" size="sm" className="w-full">
                  افزودن به سبد خرید
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

