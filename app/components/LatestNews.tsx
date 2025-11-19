const articles = [
  {
    id: 1,
    title: "Montes Suspendisse Massa Curae Malesuada",
    date: "Feb 15, 2024",
    author: "By Admin",
    image: "🧶",
  },
  {
    id: 2,
    title: "Montes Suspendisse Massa Curae Malesuada",
    date: "Feb 15, 2024",
    author: "By Admin",
    image: "👶",
  },
  {
    id: 3,
    title: "Montes Suspendisse Massa Curae Malesuada",
    date: "Feb 15, 2024",
    author: "By Admin",
    image: "🧱",
  },
];

export default function LatestNews() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Our Latest News & Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="bg-gray-100 h-48 flex items-center justify-center text-6xl">
                {article.image}
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-600 mb-2">
                  {article.date} {article.author}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {article.title}
                </h3>
                <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                  Read More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

