import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ImagePerks from "./components/ImagePerks";
import PromotionalBanners from "./components/PromotionalBanners";
import DealsOfTheDay from "./components/DealsOfTheDay";
import Categories from "./components/Categories";
import FlashSale from "./components/FlashSale";
import ShopByAge from "./components/ShopByAge";
import TrendingItems from "./components/TrendingItems";
import DiscountBanner from "./components/DiscountBanner";
import TopBrands from "./components/TopBrands";
import LatestNews from "./components/LatestNews";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
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
      <Footer />
    </div>
  );
}
