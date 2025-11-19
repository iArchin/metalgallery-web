import { toPersianNumber } from "../utils/numbers";

const ageGroups = [
  {
    id: 1,
    age: `${toPersianNumber("0")}-${toPersianNumber("1")} سال`,
    image: "👶",
    gender: "girl",
  },
  {
    id: 2,
    age: `${toPersianNumber("1")}-${toPersianNumber("2")} سال`,
    image: "👧",
    gender: "girl",
  },
  {
    id: 3,
    age: `${toPersianNumber("3")}-${toPersianNumber("4")} سال`,
    image: "👧",
    gender: "girl",
  },
  {
    id: 4,
    age: `${toPersianNumber("0")}-${toPersianNumber("2")} سال`,
    image: "👶",
    gender: "boy",
  },
  {
    id: 5,
    age: `${toPersianNumber("4")}-${toPersianNumber("7")} سال`,
    image: "👧",
    gender: "girl",
  },
  {
    id: 6,
    age: `${toPersianNumber("7")}-${toPersianNumber("10")} سال`,
    image: "👦",
    gender: "boy",
  },
  {
    id: 7,
    age: `${toPersianNumber("12") + "+"} سال`,
    image: "🧑",
    gender: "boy",
  },
];

export default function ShopByAge() {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          بر اساس سن خرید کنید
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {ageGroups.map((group) => (
            <div
              key={group.id}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center text-6xl mb-4 group-hover:border-teal-500 transition-colors shadow-md overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100">
                  {group.image}
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 text-center">
                {group.age}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
