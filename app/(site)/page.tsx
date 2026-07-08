import type { Metadata } from "next";
import Hero from "@/app/components/Hero";
import PromotionalBanners from "@/app/components/PromotionalBanners";
import DealsOfTheDay from "@/app/components/DealsOfTheDay";
import Categories from "@/app/components/Categories";
import FlashSale from "@/app/components/FlashSale";
import ShopByAge from "@/app/components/ShopByAge";
import TrendingItems from "@/app/components/TrendingItems";
import DiscountBanner from "@/app/components/DiscountBanner";
import TopBrands from "@/app/components/TopBrands";
import LatestNews from "@/app/components/LatestNews";
import { categoriesRepo, brandsRepo } from "@/lib/server/repos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "متال گالری - فروشگاه اسباب‌بازی و اکشن فیگور",
  },
  description:
    "خرید آنلاین اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه. ارسال رایگان به سراسر کشور، ضمانت اصالت کالا و بازگشت ۷ روزه.",
  openGraph: {
    title: "متال گالری | فروشگاه اسباب‌بازی، اکشن فیگور و ماکت",
    description:
      "خرید آنلاین اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه",
    images: [{ url: "/images/toy-hero.jpg", width: 1200, height: 630, alt: "متال گالری" }],
  },
};

export default async function Home() {
  const categories = (await categoriesRepo.list()).filter((c) => c.active);
  const brands = (await brandsRepo.list()).filter((b) => b.active);

  return (
    <main>
      <Hero />
      <PromotionalBanners />
      <DealsOfTheDay />
      <Categories categories={categories} />
      <FlashSale />
      <ShopByAge />
      <TrendingItems />
      <DiscountBanner />
      <TopBrands brands={brands} />
      <LatestNews />
    </main>
  );
}
