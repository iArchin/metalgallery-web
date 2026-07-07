import Hero from "@/app/components/Hero";
import ImagePerks from "@/app/components/ImagePerks";
import PromotionalBanners from "@/app/components/PromotionalBanners";
import DealsOfTheDay from "@/app/components/DealsOfTheDay";
import Categories from "@/app/components/Categories";
import FlashSale from "@/app/components/FlashSale";
import ShopByAge from "@/app/components/ShopByAge";
import TrendingItems from "@/app/components/TrendingItems";
import DiscountBanner from "@/app/components/DiscountBanner";
import TopBrands from "@/app/components/TopBrands";
import LatestNews from "@/app/components/LatestNews";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <Hero />
      <ImagePerks />
      <PromotionalBanners />
      <DealsOfTheDay />
      <Categories />
      <FlashSale />
      <ShopByAge />
      <TrendingItems />
      <DiscountBanner />
      <TopBrands />
      <LatestNews />
    </main>
  );
}
