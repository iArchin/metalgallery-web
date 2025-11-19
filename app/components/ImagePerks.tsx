const perks = [
  {
    id: 1,
    icon: "📦",
    title: "Money back guarantee",
    color: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: 2,
    icon: "🔒",
    title: "100% safe & secure",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: 3,
    icon: "🎧",
    title: "Always online 24/7",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: 4,
    icon: "🎁",
    title: "20% off by subscribing",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

export default function ImagePerks() {
  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {perks.map((perk) => (
            <div
              key={perk.id}
              className={`${perk.color} rounded-lg p-6 flex items-center gap-4`}
            >
              <div className={`text-4xl ${perk.iconColor}`}>{perk.icon}</div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">
                  {perk.id === 1 && "Return & refund"}
                  {perk.id === 2 && "Secure Payment"}
                  {perk.id === 3 && "Quality Support"}
                  {perk.id === 4 && "Daily Offers"}
                </div>
                <div className="text-xs text-gray-600">{perk.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
