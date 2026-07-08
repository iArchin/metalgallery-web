import Link from "next/link";
import { toPersianNumber } from "@/app/utils/numbers";
import { toyBanner } from "@/app/utils/images";
import { getSettings } from "@/lib/server/repos";

export default async function DiscountBanner() {
  const settings = await getSettings();
  const sale = settings.saleCampaign;

  if (!sale.enabled) return null;

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 sm:p-10 shadow-sm">
          {/* Very subtle dotted backdrop */}
          <div className="pointer-events-none absolute inset-0 bg-play-dots text-white/10" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-right">
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white mb-6">
                {toPersianNumber(sale.percent)}٪ {sale.title}
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-8 py-3 text-lg font-bold text-content border border-border cursor-pointer transition-all duration-200 active:scale-95 hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {sale.ctaText}
                </Link>
                <div className="rounded-full bg-surface px-5 py-2.5 text-base sm:text-lg font-bold text-primary shadow-sm">
                  {toPersianNumber(sale.pillPercent)}٪ تخفیف
                </div>
              </div>
            </div>

            {/* Clean real toys photo */}
            <div className="w-full md:w-80 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
              <img
                src="/images/toy-banner.jpg"
                alt={sale.title}
                loading="lazy"
                className="w-full h-40 sm:h-48 md:h-56 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
