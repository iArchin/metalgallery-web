import { listProducts } from "@/lib/server/repos";
import TrendingItemsClient from "@/app/components/TrendingItemsClient";

export default async function TrendingItems() {
  const products = (await listProducts()).filter((p) => p.isTrending);
  if (!products.length) return null;
  return <TrendingItemsClient products={products} />;
}
