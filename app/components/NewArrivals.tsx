import { formatPersianNumber, toPersianNumber } from '../utils/numbers';
import Button from './Button';

const newProducts = [
  { id: 1, name: 'ماشین کنترلی', price: '450,000', image: '🚗' },
  { id: 2, name: 'عروسک پولیشی', price: '320,000', image: '🧸' },
  { id: 3, name: `پازل ${toPersianNumber('1000')} تکه`, price: '280,000', image: '🧩' },
  { id: 4, name: 'لگو ساختمانی', price: '550,000', image: '🧱' },
  { id: 5, name: 'بازی فکری', price: '380,000', image: '🎲' },
  { id: 6, name: 'اسباب‌بازی موزیکال', price: '420,000', image: '🎵' },
];

export default function NewArrivals() {
  return (
    <section className="py-16 px-4 bg-[#FEFCFD]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">محصولات جدید</h2>
          <Button variant="text">
            مشاهده همه →
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {newProducts.map((product) => (
            <div
              key={product.id}
              className=" rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="bg-gradient-to-br from-[#E3F2FD] to-[#FEFCFD] rounded-xl p-8 mb-4 flex items-center justify-center text-5xl">
                {product.image}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">{formatPersianNumber(product.price)} تومان</span>
                <Button variant="blue" size="sm">
                  افزودن
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

