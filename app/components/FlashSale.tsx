import { listProducts } from "@/lib/server/repos";
import FlashSaleClient from "@/app/components/FlashSaleClient";

export default async function FlashSale() {
  const products = (await listProducts()).filter((p) => p.isFlashSale);
  if (!products.length) return null;
  return <FlashSaleClient products={products} />;
}
