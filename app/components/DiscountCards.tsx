import { toPersianNumber } from "../utils/numbers";
import Button from "./Button";

const discountCards = [
  {
    id: 1,
    title: "تخفیف ویژه",
    discount: "50%",
    description: "خرید بالای ۵۰۰ هزار تومان",
    bgColor: "from-[#E3F2FD] to-[#90CAF9]",
  },
  {
    id: 2,
    title: "ارسال رایگان",
    description: "برای خریدهای بالای ۳۰۰ هزار تومان",
    bgColor: "from-[#FEFCFD] to-[#E3F2FD]",
  },
  {
    id: 3,
    title: "هدیه رایگان",
    description: "با هر خرید بالای ۲۰۰ هزار تومان",
    bgColor: "from-[#90CAF9] to-[#E3F2FD]",
  },
];

export default function DiscountCards() {
  return (
    <section className="py-16 px-4  border-t-2 border-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          پیشنهادات ویژه
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {discountCards.map((card) => (
            <div
              key={card.id}
              className="bg-yellow-400 border-2 border-black p-8"
            >
              <div className="text-center">
                {card.discount && (
                  <div className="text-6xl font-bold text-gray-900 mb-4">
                    {toPersianNumber(card.discount)}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-700 text-lg">{card.description}</p>
                <Button variant="secondary" size="md" className="mt-6">
                  مشاهده بیشتر
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
