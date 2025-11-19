const brands = [
  { name: "KIDZ", items: 175, color: "bg-yellow-400" },
  { name: "Game", items: 109, color: "bg-blue-300" },
  { name: "Kids", items: 100, color: "bg-green-400" },
  { name: "Party", items: 104, color: "bg-purple-400" },
  { name: "KID'S ZONE", items: 112, color: "bg-green-300" },
  { name: "SUPER", items: 140, color: "bg-purple-300" },
];

export default function TopBrands() {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Popular Brand</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map((brand, index) => (
            <div
              key={index}
              className={`${brand.color} rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <div className="text-2xl font-bold text-gray-900 mb-2">{brand.name}</div>
              <div className="text-sm text-gray-700">{brand.items} items</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
