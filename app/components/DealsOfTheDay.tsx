import { listProducts } from "@/lib/server/repos";
import DealsOfTheDayClient from "@/app/components/DealsOfTheDayClient";

export default async function DealsOfTheDay() {
  const products = (await listProducts()).filter((p) => p.isDeal);
  if (!products.length) return null;
  return <DealsOfTheDayClient products={products} />;
}
