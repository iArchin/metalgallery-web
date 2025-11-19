import Button from "./Button";

const products = [
  { id: 1, name: "Green Toy Truck", price: 28.00, image: "🚛", rating: 5 },
  { id: 2, name: "Stacking Ring Toy", price: 15.00, image: "🎯", rating: 5 },
  { id: 3, name: "Blue Crane Truck", price: 30.00, image: "🚛", rating: 5 },
  { id: 4, name: "Building Blocks", price: 22.00, image: "🧱", rating: 5 },
  { id: 5, name: "Teddy Bear", price: 18.00, image: "🧸", rating: 5 },
  { id: 6, name: "Panda Plush", price: 20.00, image: "🐼", rating: 5 },
];

export default function TrendingItems() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Promotional Banner */}
          <div className="md:col-span-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-6xl font-bold mb-4 text-white drop-shadow-lg">SALE</div>
              <div className="absolute top-4 right-4 text-4xl opacity-50">🎁</div>
              <div className="absolute bottom-4 left-4 text-3xl opacity-50">✈️</div>
            </div>
          </div>

          {/* Products */}
          <div className="md:col-span-3">
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
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    </div>
                    <Button variant="primary" size="sm" className="w-full">
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

