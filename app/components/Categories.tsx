const categories = [
  { id: 1, name: "Toy & Game", image: "🧸" },
  { id: 2, name: "Smart Toys", image: "🧱" },
  { id: 3, name: "Outdoor Toy", image: "🧩" },
  { id: 4, name: "Movement Toy", image: "🐴" },
  { id: 5, name: "Control Toy", image: "🦕" },
];

export default function Categories() {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Popular Categories
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center text-5xl mb-4 group-hover:border-teal-500 transition-colors shadow-md">
                {category.image}
              </div>
              <h3 className="text-base font-semibold text-gray-900 text-center">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
