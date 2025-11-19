import Button from "./Button";

const products = [
  { id: 1, name: "Blue Rocking Horse", price: 25.00, image: "🐴", rating: 5 },
  { id: 2, name: "Pink Pool Toy", price: 18.00, image: "🏊", rating: 5 },
  { id: 3, name: "Building Blocks", price: 22.00, image: "🧱", rating: 5 },
  { id: 4, name: "Musical Toy", price: 20.00, image: "🎵", rating: 5 },
  { id: 5, name: "Round Rattle", price: 12.00, image: "🔔", rating: 5 },
];

export default function FlashSale() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Flash Sale!</h2>
        
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
    </section>
  );
}

