import Button from "./Button";

export default function Hero() {
  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Large Banner - Left */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <img
                src="/images/cloud.png"
                alt="cloud"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative z-10">
              <div className="text-red-600 font-bold text-lg mb-2">
                UP TO 10% OFF
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Buy Children's Toys And Clothes
              </h2>
              <Button variant="primary" size="lg">
                Shop Now
              </Button>
            </div>
            <div className="absolute bottom-0 right-0 w-48 h-48 opacity-30">
              <div className="text-8xl">📷</div>
            </div>
          </div>

          {/* Smaller Banner - Right */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 relative overflow-hidden text-white">
            <div className="relative z-10">
              <div className="text-2xl font-bold mb-2">Crianças</div>
              <div className="text-xl font-semibold mb-4">
                15% OFF on Kids' Toys and Gifts!
              </div>
              <Button variant="secondary" size="md">
                Shop Now
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20">
              <div className="text-6xl">📢</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
