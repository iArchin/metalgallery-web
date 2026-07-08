import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/app/components/ProductDetail";
import JsonLdProduct from "@/app/components/JsonLdProduct";
import { getProduct, listProducts } from "@/lib/server/repos";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(parseInt(id));
  if (!product || !product.active) {
    return { title: "محصول یافت نشد" };
  }
  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `https://metalgallery.ir/product/${product.id}`,
    },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "article",
      images: product.image
        ? [{ url: product.image, width: 600, height: 600, alt: product.name }]
        : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(parseInt(id));
  if (!product || !product.active) notFound();

  const related = (await listProducts())
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  return (
    <main>
      <JsonLdProduct product={product} />
      <ProductDetail product={product} related={related} />
    </main>
  );
}
